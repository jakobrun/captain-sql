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
        columnsPrompt = gandalf.createColumnsPrompt(m, editor, getTables, pubsub),
        sqlclient = gandalf.createSqlClientModule(m, pubsub, fs, editor, connection, settings, result, statusbar, bookmarkModule, actions, columnsPrompt);

    gandalf.createSqlHint(pubsub);

    m.route(document.getElementById('body'), '/login', {
        '/login': loginModule,
        '/sql/:conn': sqlclient
    });
}());
