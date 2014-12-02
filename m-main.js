/*global m, CodeMirror, createLoginModule, createSqlClientModule*/
'use strict';
var connection = require('./js/remoteconnection'),
  settings = require(process.env.HOME + '/.gandalf/settings'),
  loginModule = createLoginModule(m, connection, settings),
  sqlclient = createSqlClientModule(m, CodeMirror, connection, settings);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql/:conn': sqlclient
});