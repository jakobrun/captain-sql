/*global m, CodeMirror, createLoginModule, createSqlClientModule, createBookmarkModel, createSqlHint*/
'use strict';
var connection = require('./js/connection'),
  fs = require('fs'),
  events = require('events'),
  pubsub = new events.EventEmitter(),
  settings = require(process.env.HOME + '/.gandalf/settings'),
  loginModule = createLoginModule(m, connection, settings),
  bookmarkModule = createBookmarkModel(m, fs, pubsub),
  sqlclient = createSqlClientModule(m, fs, CodeMirror, connection, settings, bookmarkModule);

createSqlHint(pubsub);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql/:conn': sqlclient
});