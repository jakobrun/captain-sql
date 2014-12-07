var createLoginModule = function(m, connection, settings) {
  'use strict';
  var errorMsg = m.prop('');
  var conn = {
    name: m.prop(''),
    host: m.prop(''),
    username: m.prop(''),
    password: m.prop('')
  };

  var selectConn = function(e) {
    var i = e.target.selectedIndex - 1;
    if (i > -1) {
      conn.host(settings.connections[i].host);
      conn.username(settings.connections[i].user);
      conn.name(settings.connections[i].name);
    }
  };

  var login = function() {
    m.startComputation();
    //Connect
    connection.connect({
      host: conn.host(),
      user: conn.user,
      password: conn.password()
    }).then(function() {
      m.route('/sql/' + conn.name());
    }).fail(function(err) {
      errorMsg(err.message);
    }).then(m.endComputation);
  };

  var loginOnEnter = function (prop) {
    return function (e) {
      if(e.keyCode === 13) {
        login();
      } else {
        prop(e.target.value);
      }
    };
  };

  return {
    controller: function() {},
    view: function() {
      return m('div', {
        'class': 'popup container form'
      }, [
        m('h2', {'class': 'popup-title'}, 'Connect to database'),
        m('div', {
          'class': 'error'
        }, errorMsg()),
        m('div', {'class': 'form-element'}, [
          m('select', {
            'class': 'h-fill',
            autofocus: 'true',
            onchange: selectConn
          }, [
            m('option', {
              value: ''
            }, '-- choose conection --')
          ].concat(settings.connections.map(function(c) {
            return m('option', {
              value: c.name
            }, c.name);
          })))
        ]),
        m('div', {'class': 'form-element'}, [
          m('label', {
            'for': 'host'
          }, 'Host:'),
          m('input', {
            'id': 'host',
            'class': 'h-fill',
            value: conn.host(),
            onkeyup: loginOnEnter(conn.host)
          })
        ]),
        m('div', {'class': 'form-element'}, [
          m('label', {
            'for': 'username'
          }, 'Username:'),
          m('input', {
            'id': 'username',
            'class': 'h-fill',
            value: conn.username(),
            onkeyup: loginOnEnter(conn.username)
          })
        ]),
        m('div', {'class': 'form-element'}, [
          m('label', {
            'for': 'password'
          }, 'Password:'),
          m('input', {
            'id': 'password',
            'class': 'h-fill',
            type: 'password',
            value: conn.password(),
            onkeyup: loginOnEnter(conn.password)
          })
        ]),
        m('div', {'class': 'form-element form-btn-bar'}, [
          m('button', {
            onclick: login
          }, 'Connect')
        ])
      ]);
    }
  };
};
