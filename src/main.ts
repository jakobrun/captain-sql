import { EventEmitter } from 'events'
import * as fs from 'fs'
import { connect } from './modules/connect'
import { createExecuter } from './modules/executer'
import { getSettings } from './modules/get_settings'
import { getTables } from './modules/get_tables'
import { createGlobalShortcuts } from './modules/globalShortcuts'
import { getHistoryModel } from './modules/history'
import { createSchemaHandler } from './modules/schema'
import { createSqlHint } from './modules/sql-hint'
import { createActions } from './views/actions'
import { createBookmarkModel } from './views/bookmark'
import { createColumnsPrompt } from './views/columns_prompt'
import { createEditor } from './views/editor'
import { createErrorHandler } from './views/errorhandler'
import { createHistoryView } from './views/history'
import { createLoginModule } from './views/login'
import { createPopupmenu } from './views/popupmenu'
import { createResult } from './views/result'
import { createSplitter } from './views/splitter'
import { createStatusbar } from './views/statusbar'

const { ipcRenderer, remote } = require('electron')
const m = require('mithril')
const CodeMirror = require('codemirror')
require('codemirror/addon/hint/show-hint.js')
require('codemirror/addon/search/searchcursor.js')
require('codemirror/addon/dialog/dialog.js')
require('codemirror/keymap/sublime.js')
require('codemirror/mode/sql/sql.js')
require('./modules/sql-hint.js')

getSettings(process.env.HOME)
    .then(settings => {
        const splitter = createSplitter(m)

        const pubsub = new EventEmitter()
        createGlobalShortcuts(pubsub)
        const errorHandler = createErrorHandler(m)
        const loginModule = createLoginModule(m, pubsub, connect, settings)
        const actions = createActions(m, pubsub, createPopupmenu)
        const statusbar = createStatusbar(m, pubsub)
        const editor = createEditor(m, pubsub, CodeMirror, fs)
        const result = createResult(m, pubsub)
        const bookmarkModule = createBookmarkModel(
            m,
            fs,
            pubsub,
            editor,
            createPopupmenu
        )
        const historyModule = createHistoryView(
            m,
            pubsub,
            createPopupmenu,
            getHistoryModel
        )
        const columnsPrompt = createColumnsPrompt(
            m,
            editor,
            getTables,
            pubsub,
            createPopupmenu
        )
        let connected = false

        window.addEventListener(
            'beforeunload',
            () => {
                pubsub.emit('disconnect')
            },
            false
        )

        createExecuter(pubsub, editor, m)
        createSchemaHandler(fs, pubsub)
        createSqlHint(pubsub, editor, getTables, CodeMirror)

        pubsub.on('new-window', () => {
            console.log('emit new-window')
            ipcRenderer.send('new-window')
        })

        pubsub.on('connected', connection => {
            document.body.className =
                'theme--' + (connection.settings().theme || 'dark-orange')

            connected = true
            document.title =
                'Gandalf - connected to ' + connection.settings().name
            m.route('/sql/' + connection.settings().name)
        })

        function Controller() {
            const connName = m.route.param('conn')
            if (!connected && connName) {
                const connSettings = settings.connections.find(
                    c => c.name === connName
                )
                if (connSettings.host === 'hsql:inmemory') {
                    console.log('reconnect to hsql:inmemory!!')
                    connect({ host: connSettings.host }, connSettings).then(
                        connection => {
                            pubsub.emit('connected', connection)
                        }
                    )
                } else {
                    pubsub.emit('login')
                }
            }
        }
        const sqlModule = {
            controller: Controller,
            view() {
                return [
                    loginModule.view(),
                    editor.view(),
                    splitter(),
                    result.view(),
                    statusbar.view(),
                    actions.view(),
                    bookmarkModule.view(),
                    historyModule.view(),
                    columnsPrompt.view(),
                    errorHandler.view(),
                ]
            },
        }

        m.route(
            document.getElementById('body'),
            '/sql/' +
                (remote.getGlobal('sharedObject').dev
                    ? 'hsql inmemory dev'
                    : ''),
            {
                '/sql': sqlModule,
                '/sql/:conn': sqlModule,
            }
        )
    })
    .catch(err => {
        console.error('startup error', err.message, err.stack)
    })
