/*global m*/
'use strict';
var loginModule = require('./js/login')(m),
  sqlclient = require('./js/sqlclient')(m);

m.route(document.getElementById('body'), '/login', {
  '/login': loginModule,
  '/sql': sqlclient
});