/*global CodeMirror*/
(function() {
  'use strict';
  var gui = require('nw.gui'),
    win = gui.Window.get(),
    nativeMenuBar = new gui.Menu({
      type: 'menubar'
    });
  nativeMenuBar.createMacBuiltin('Gandalf');
  win.menu = nativeMenuBar;

  require('./js/modules/get_settings')(process.env.HOME).then(function(settings) {
    var connect = require('./js/modules/connect'),
      fs = require('fs'),
      events = require('events'),
      getTables = require('./js/modules/get_tables'),
      createHistory = require('./js/modules/history'),
      pubsub = new events.EventEmitter(),
      errorHandler = exports.createErrorHandler(m),
      loginModule = exports.createLoginModule(m, pubsub, connect, settings),
      actions = exports.createActions(m, pubsub, exports.createPopupmenu),
      statusbar = exports.createStatusbar(m, pubsub),
      editor = exports.createEditor(m, pubsub, CodeMirror, fs),
      result = exports.createResult(m, pubsub),
      bookmarkModule = exports.createBookmarkModel(m, fs, pubsub, editor, exports.createPopupmenu),
      historyModule = exports.createHistoryView(m, pubsub, exports.createPopupmenu, createHistory),
      columnsPrompt = exports.createColumnsPrompt(m, editor, getTables, pubsub, exports.createPopupmenu),
      connected = false;

    win.on('close', function () {
      pubsub.emit('disconnect');
      this.close(true);
    });

    exports.createExecuter(pubsub, editor);
    exports.createSchemaHandler(fs, pubsub);
    exports.createSqlHint(pubsub, editor, getTables);

    pubsub.on('new-window', function() {
      var path = window.location.href;
      path = path.substring(0, path.indexOf('.html') + 5);
      console.log(path);
      gui.Window.open(path, {
        focus: true,
        transparent: true,
        toolbar: false
      });
    });

    win.on('focus', function() {
      pubsub.emit('editor-focus');
    });

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
      controller: function() {
        if(!connected) {
          var connName = m.route.param('conn'),
            connSettings = settings.connections.filter(function(c) {
              return c.name === connName;
            })[0];
          if (connSettings.host === 'hsql:inmemory') {
            console.log('reconnect to hsql:inmemory!!');
            connect({host: connSettings.host}, connSettings).then(function (connection) {
              pubsub.emit('connected', connection);
            });
          } else {
            m.route('/login');
          }
        }
      },
      view: function() {
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
  }).fail(function(err) {
    console.error('startup error', err.message, err.stack);
  });
}());
