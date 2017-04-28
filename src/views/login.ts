'use strict';
exports.createLoginModule = function (m, pubsub, connect, settings) {
  var connecting = m.prop(false),
    errorMsg = m.prop(''),
    loginInfo = {
      host: m.prop(''),
      username: m.prop(''),
      password: m.prop('')
    },
    conn;

  var selectConn = function (e) {
    var i = e.target.selectedIndex - 1;
    if (i > -1) {
      conn = settings.connections[i];
      loginInfo.host(conn.host);
      loginInfo.username(conn.user);
    }
  };

  var clone = function (obj) {
    return Object.keys(obj).reduce(function (newObj, key) {
      newObj[key] = obj[key];
      return newObj;
    }, {});
  };

  var login = function () {
    m.startComputation();
    connecting(true);
    m.endComputation();
    var config: any = clone(conn.properties || {});
    config.host = loginInfo.host();
    config.user = loginInfo.username();
    config.password = loginInfo.password();
    //Connect
    connect(config, conn).then(function (connection) {
      m.startComputation();
      pubsub.emit('connected', connection);
      m.endComputation();
    }).fail(function (err) {
      console.log('connection failure');
      m.startComputation();
      errorMsg(err.message);
      m.endComputation();
    }).then(function () {
      m.startComputation();
      connecting(false);
      m.endComputation();
    });
  };

  pubsub.on('data-error', function (err) {
    if (err.message.indexOf('The connection does not exist') > 0) {
      pubsub.emit('reconnecting');
      login();
    }
  });

  var loginOnEnter = function (prop) {
    return function (e) {
      if (e.keyCode === 13) {
        login();
      } else {
        prop(e.target.value);
      }
    };
  };

  return {
    controller: function () { },
    view: function () {
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
              ].concat(settings.connections.map(function (c) {
                return m('option', {
                  value: c.name
                }, c.name);
              })))
            ]),
          m('div', {
            'class': 'form-element'
          }, [
              m('input', {
                'id': 'host',
                'placeholder': 'Hostname',
                'class': 'h-fill',
                value: loginInfo.host(),
                onkeyup: loginOnEnter(loginInfo.host)
              })
            ]),
          m('div', {
            'class': 'form-element'
          }, [
              m('input', {
                'id': 'username',
                'placeholder': 'Username',
                'class': 'h-fill',
                value: loginInfo.username(),
                onkeyup: loginOnEnter(loginInfo.username)
              })
            ]),
          m('div', {
            'class': 'form-element'
          }, [
              m('input', {
                'id': 'password',
                'class': 'h-fill',
                'placeholder': 'Password',
                type: 'password',
                value: loginInfo.password(),
                onkeyup: loginOnEnter(loginInfo.password)
              })
            ]),
          m('div', {
            'class': 'form-element form-btn-bar'
          }, [
              m('button', {
                onclick: login,
                'class': (connecting() ? 'hidden' : '')
              }, 'Connect'),
              m('div', { 'class': 'spinner-loader' + (connecting() ? '' : ' hidden') }, 'Loading…')
            ])
        ]);
    }
  };
};
