/*global CodeMirror*/
(function() {
    'use strict';
    var connection = require('./js/connection'),
        fs = require('fs'),
        events = require('events'),
        pubsub = new events.EventEmitter(),
        settings = require(process.env.HOME + '/.gandalf/settings'),
        loginModule = gandalf.createLoginModule(m, connection, settings),
        actions = gandalf.createActions(m, pubsub),
        bookmarkModule = gandalf.createBookmarkModel(m, fs, pubsub),
        editor = gandalf.createEditor(m, pubsub, CodeMirror),
        result = gandalf.createResult(m, pubsub),
        sqlclient = gandalf.createSqlClientModule(m, pubsub, fs, editor, connection, settings, result, bookmarkModule, actions);

    gandalf.createSqlHint(pubsub);

    m.route(document.getElementById('body'), '/login', {
        '/login': loginModule,
        '/sql/:conn': sqlclient
    });
}());
