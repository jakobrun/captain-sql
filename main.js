/*global m, CodeMirror, createLoginModule, createSqlClientModule, createBookmarkModel*/
'use strict';
var connection = require('./js/connection'),
  fs = require('fs'),
  settings = require(process.env.HOME + '/.gandalf/settings'),
  loginModule = createLoginModule(m, connection, settings),
  bookmarkModule = createBookmarkModel(m, fs),
  sqlclient = createSqlClientModule(m, fs, CodeMirror, connection, settings, bookmarkModule);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql/:conn': sqlclient
});