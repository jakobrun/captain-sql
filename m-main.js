/*global m, CodeMirror*/
'use strict';
var connection = require('./js/remoteconnection'),
  loginModule = require('./js/login')(m, connection),
  sqlclient = require('./js/sqlclient')(m, CodeMirror, connection);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql': sqlclient
});