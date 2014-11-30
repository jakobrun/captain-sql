'use strict';
var settings = require(process.env.HOME + '/.gandalf/settings');

module.exports = function(m, connection) {
	var errorMsg = m.prop('');
	var conn = {
		host: m.prop(''),
		username: m.prop(''),
		password: m.prop('')
	};

	var selectConn = function (e) {
		var i = e.target.selectedIndex - 1;
		if(i>-1) {
		  conn.host(settings.connections[i].host);
		  conn.username(settings.connections[i].user);
		}
	};

	var login = function () {
		m.startComputation();
		//Connect
    connection.connect({
      host: conn.host(),
      user: conn.user,
      password: conn.password()
    }).then(function() {
    	m.route('/sql');
    }).fail(function(err) {
    	errorMsg(err.message);
    }).then(m.endComputation);
	};

  return {
    controller: function() {
    },
    view: function() {
      return [m('div', {'class': 'error'}, errorMsg()),
        m('div', [
          m('select', {autofocus: 'true', onchange: selectConn}, [
            m('option', {value: ''}, '-- choose conection --')
          ].concat(settings.connections.map(function (c) {
          	return m('option', {value: c.name}, c.name);
          })))
        ]),
        m('div', [
          m('label', {'for': 'host'}, 'Host:'),
          m('input', {'id': 'host', value: conn.host(), onchange: m.withAttr('value', conn.host)})
        ]),
        m('div', [
          m('label', {'for': 'username'}, 'Username:'),
          m('input', {'id': 'username', value: conn.username(), onchange: m.withAttr('value', conn.username)})
        ]),
        m('div', [
          m('label', {'for': 'password'}, 'Password:'),
          m('input', {'id': 'password', type: 'password', value: conn.password(), onchange: m.withAttr('value', conn.password)})
        ]),
        m('button', {onclick: login}, 'Login')
      ];
    }
  };
};
