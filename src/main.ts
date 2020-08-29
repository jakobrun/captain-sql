import { EventEmitter } from 'events'
import * as fs from 'fs'
import { createCommitControl } from './modules/commitControl'
import { connect } from './modules/connectors/connect'
import { createExecuter } from './modules/executer'
import { getTables } from './modules/get_tables'
import { createGlobalShortcuts } from './modules/globalShortcuts'
import { createGetHistoryModel } from './modules/history'
import { createSchemaHandler } from './modules/schema'
import { getSettings } from './modules/settings'
import { createSqlHint } from './modules/sql-hint'
import { createActions } from './views/actions'
import { createBookmarkModel } from './views/bookmark'
import { createColumnsPrompt } from './views/columns_prompt'
import { createEditConnection } from './views/editConnection'
import { createEditor } from './views/editor'
import { createErrorHandler } from './views/errorhandler'
import { createHistoryView } from './views/history'
import { createLoginModule } from './views/login'
import { createPopupmenu } from './views/popupmenu'
import { createResult } from './views/result'
import { createSplitter } from './views/splitter'
import { createStatusbar } from './views/statusbar'
import { createTableSearch } from './views/tableSearch'
import { readAppDataFile, writeAppDataFile } from './modules/appData'

const { ipcRenderer, remote } = require('electron')
const m = require('mithril')
const CodeMirror = require('codemirror')
require('codemirror/addon/hint/show-hint.js')
require('codemirror/addon/search/searchcursor.js')
require('codemirror/addon/dialog/dialog.js')
require('codemirror/keymap/sublime.js')
require('codemirror/mode/sql/sql.js')
require('./modules/sql-hint.js')

if (remote.getGlobal('sharedObject').dev) {
    require('electron-connect').client.create()
    require('electron-css-reload')()
}

getSettings()
    .then(settings => {
        const splitter = createSplitter(m)

        const pubsub = new EventEmitter()
        createGlobalShortcuts(pubsub)
        createCommitControl(pubsub)
        const errorHandler = createErrorHandler(m)
        const loginModule = createLoginModule(m, pubsub, connect, settings)
        const actions = createActions(m, pubsub, createPopupmenu)
        const tableSearch = createTableSearch(m, pubsub, createPopupmenu)
        const statusbar = createStatusbar(m, pubsub)
        const editor = createEditor(m, pubsub, CodeMirror)
        const result = createResult(m, pubsub)
        const editConnection = createEditConnection(m, pubsub, settings)
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
            createGetHistoryModel(readAppDataFile, writeAppDataFile)
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
        createSchemaHandler(readAppDataFile, pubsub)
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
                if (connSettings && connSettings.host === 'hsql:inmemory') {
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
                    tableSearch.view(),
                    bookmarkModule.view(),
                    historyModule.view(),
                    columnsPrompt.view(),
                    errorHandler.view(),
                    editConnection.view(),
                ]
            },
        }

        m.route(
            document.getElementById('body'),
            '/sql/' +
                (remote.getGlobal('sharedObject').dev ? 'Gandalf dev' : ''),
            {
                '/sql': sqlModule,
                '/sql/:conn': sqlModule,
            }
        )
    })
    .catch(err => {
        console.error('startup error', err.message, err.stack)
    })
