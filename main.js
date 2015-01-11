/*global CodeMirror*/
(function() {
  'use strict';
  var connection = require('./js/connection'),
    fs = require('fs'),
    events = require('events'),
    getTables = require('./js/get_tables'),
    pubsub = new events.EventEmitter(),
    settings = require(process.env.HOME + '/.gandalf/settings'),
    loginModule = gandalf.createLoginModule(m, connection, settings),
    actions = gandalf.createActions(m, pubsub),
    statusbar = gandalf.createStatusbar(m, pubsub),
    editor = gandalf.createEditor(m, pubsub, CodeMirror),
    result = gandalf.createResult(m, pubsub),
    bookmarkModule = gandalf.createBookmarkModel(m, fs, pubsub, editor),
    columnsPrompt = gandalf.createColumnsPrompt(m, editor, getTables, pubsub);

  gandalf.createExecuter(pubsub, editor, connection);
  gandalf.createSchemaHandler(fs, pubsub, connection);
  gandalf.createSqlHint(pubsub, editor, getTables);

  var sqlModule = {
    controller: function() {
      var connName = m.route.param('conn'),
        connSettings = settings.connections.filter(function(c) {
          return c.name === connName;
        })[0];
      pubsub.emit('connected', connSettings);
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
        columnsPrompt.view()
      ];
    }
  };

  m.route(document.getElementById('body'), '/login', {
    '/login': loginModule,
    '/sql/:conn': sqlModule
  });
}());
