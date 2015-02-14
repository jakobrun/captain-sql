exports.createLoginModule = function(m, pupsub, connect, settings) {
  'use strict';
  var errorMsg = m.prop(''),
    loginInfo = {
      host: m.prop(''),
      username: m.prop(''),
      password: m.prop('')
    },
    conn;

  var selectConn = function(e) {
    var i = e.target.selectedIndex - 1;
    if (i > -1) {
      conn = settings.connections[i];
      loginInfo.host(conn.host);
      loginInfo.username(conn.user);
    }
  };

  var login = function() {
    m.startComputation();
    var config = Object.create(conn.properties || {});
    config.host = loginInfo.host();
    config.user = loginInfo.username();
    config.password = loginInfo.password();
    //Connect
    connect(config, conn).then(function(connection) {
      pupsub.emit('connected', connection);
    }).fail(function(err) {
      errorMsg(err.message);
    }).then(m.endComputation);
  };

  var loginOnEnter = function(prop) {
    return function(e) {
      if (e.keyCode === 13) {
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
        m('h2', {
          'class': 'popup-title'
        }, 'Connect to database'),
        m('div', {
          'class': 'error'
        }, errorMsg()),
        m('div', {
          'class': 'form-element'
        }, [
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
        m('div', {
          'class': 'form-element'
        }, [
          m('label', {
            'for': 'host'
          }, 'Host:'),
          m('input', {
            'id': 'host',
            'class': 'h-fill',
            value: loginInfo.host(),
            onkeyup: loginOnEnter(loginInfo.host)
          })
        ]),
        m('div', {
          'class': 'form-element'
        }, [
          m('label', {
            'for': 'username'
          }, 'Username:'),
          m('input', {
            'id': 'username',
            'class': 'h-fill',
            value: loginInfo.username(),
            onkeyup: loginOnEnter(loginInfo.username)
          })
        ]),
        m('div', {
          'class': 'form-element'
        }, [
          m('label', {
            'for': 'password'
          }, 'Password:'),
          m('input', {
            'id': 'password',
            'class': 'h-fill',
            type: 'password',
            value: loginInfo.password(),
            onkeyup: loginOnEnter(loginInfo.password)
          })
        ]),
        m('div', {
          'class': 'form-element form-btn-bar'
        }, [
          m('button', {
            onclick: login
          }, 'Connect')
        ])
      ]);
    }
  };
};
