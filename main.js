/*global CodeMirror*/
'use strict';
const { ipcRenderer } = require('electron');
const m = require('./bower_components/mithriljs/mithril.js');
const CodeMirror = require('./bower_components/codemirror/lib/codemirror.js');
require('./bower_components/codemirror/addon/hint/show-hint.js');
require('./bower_components/codemirror/addon/search/searchcursor.js');
require('./bower_components/codemirror/addon/dialog/dialog.js');
require('./bower_components/codemirror/keymap/sublime.js');
require('./bower_components/codemirror/mode/sql/sql.js');
require('./dist/modules/sql-hint.js')

require('./dist/modules/get_settings')(process.env.HOME).then(function (settings) {
  const connect = require('./dist/modules/connect'),
    fs = require('fs'),
    events = require('events'),
    getTables = require('./dist/modules/get_tables'),
    createHistory = require('./dist/modules/history'),
    { createErrorHandler } = require('./dist/views/errorhandler'),
    { createLoginModule } = require('./dist/views/login'),
    { createActions } = require('./dist/views/actions'),
    { createPopupmenu } = require('./dist/views/popupmenu'),
    { createStatusbar } = require('./dist/views/statusbar'),
    { createEditor } = require('./dist/views/editor'),
    { createResult } = require('./dist/views/result'),
    { createBookmarkModel } = require('./dist/views/bookmark'),
    { createHistoryView } = require('./dist/views/history'),
    { createColumnsPrompt } = require('./dist/views/columns_prompt'),
    { createExecuter } = require('./dist/modules/executer'),
    { createSchemaHandler } = require('./dist/modules/schema'),
    { createSqlHint } = require('./dist/modules/sql-hint');

  var pubsub = new events.EventEmitter(),
    errorHandler = createErrorHandler(m),
    loginModule = createLoginModule(m, pubsub, connect, settings),
    actions = createActions(m, pubsub, createPopupmenu),
    statusbar = createStatusbar(m, pubsub),
    editor = createEditor(m, pubsub, CodeMirror, fs),
    result = createResult(m, pubsub),
    bookmarkModule = createBookmarkModel(m, fs, pubsub, editor, createPopupmenu),
    historyModule = createHistoryView(m, pubsub, createPopupmenu, createHistory),
    columnsPrompt = createColumnsPrompt(m, editor, getTables, pubsub, createPopupmenu),
    connected = false;


  window.addEventListener('beforeunload', function (e) {
    pubsub.emit('disconnect');
  }, false);

  createExecuter(pubsub, editor, m);
  createSchemaHandler(fs, pubsub);
  createSqlHint(pubsub, editor, getTables, CodeMirror);

  pubsub.on('new-window', () => {
    console.log('emit new-window');
    ipcRenderer.send('new-window');
  });

  // win.on('focus', function() {
  //   pubsub.emit('editor-focus');
  // });

  pubsub.on('connected', function (connection) {
    var settingsStyle = document.getElementById('settings-style'),
      primaryColor = connection.settings().primaryColor || '#e35f28';
    settingsStyle.textContent = '.table-head th { color: ' +
      primaryColor +
      '} .cm-s-gandalf span.cm-keyword { color: ' +
      primaryColor +
      '} .p-menu-item-selected {background-color: ' +
      primaryColor +
      '} .CodeMirror-hint-active {background-color: ' +
      primaryColor +
      '}';

    connected = true;
    document.title = 'Gandalf - connected to ' + connection.settings().name;
    m.route('/sql/' + connection.settings().name);
    pubsub.once('disconnect', function () {
      connection.close();
      m.route('/login');
    });
  });

  var sqlModule = {
    controller: function () {
      if (!connected) {
        var connName = m.route.param('conn'),
          connSettings = settings.connections.filter(function (c) {
            return c.name === connName;
          })[0];
        if (connSettings.host === 'hsql:inmemory') {
          console.log('reconnect to hsql:inmemory!!');
          connect({ host: connSettings.host }, connSettings).then(function (connection) {
            pubsub.emit('connected', connection);
          });
        } else {
          m.route('/login');
        }
      }
    },
    view: function () {
      return [
        editor.view(),
        m('div', {
          'class': 'result-gutter'
        }),
        result.view(),
        statusbar.view(),
        actions.view(),
        bookmarkModule.view(),
        historyModule.view(),
        columnsPrompt.view(),
        errorHandler.view()
      ];
    }
  };

  m.route(document.getElementById('body'), '/login', {
    '/login': loginModule,
    '/sql/:conn': sqlModule
  });
}).catch(function (err) {
  console.error('startup error', err.message, err.stack);
});
