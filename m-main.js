/*global m, CodeMirror, createLoginModule, createSqlClientModule*/
'use strict';
var connection = require('./js/remoteconnection'),
  loginModule = createLoginModule(m, connection),
  sqlclient = createSqlClientModule(m, CodeMirror, connection);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql': sqlclient
});