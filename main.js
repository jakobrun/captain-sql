/*global CodeMirror*/
(function() {
    'use strict';
    var connection = require('./js/connection'),
        fs = require('fs'),
        events = require('events'),
        pubsub = new events.EventEmitter(),
        settings = require(process.env.HOME + '/.gandalf/settings'),
        loginModule = gandalf.createLoginModule(m, connection, settings),
        bookmarkModule = gandalf.createBookmarkModel(m, fs, pubsub),
        sqlclient = gandalf.createSqlClientModule(m, fs, CodeMirror, connection, settings, bookmarkModule);

    gandalf.createSqlHint(pubsub);

    m.route(document.getElementById('body'), '/login', {
        '/login': loginModule,
        '/sql/:conn': sqlclient
    });
}());
