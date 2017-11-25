export const createLoginModule = (m, pubsub, connect, settings) => {
    const connecting = m.prop(false)
    const show = m.prop(true)
    const errorMsg = m.prop('')
    const loginInfo = {
        host: m.prop(''),
        username: m.prop(''),
        password: m.prop(''),
    }
    let conn

    const selectConn = e => {
        const i = e.target.selectedIndex - 1
        if (i > -1) {
            conn = settings.connections[i]
            loginInfo.host(conn.host)
            loginInfo.username(conn.user)
        }
    }

    const clone = obj => {
        return Object.keys(obj).reduce((newObj, key) => {
            newObj[key] = obj[key]
            return newObj
        }, {})
    }

    const login = () => {
        m.startComputation()
        connecting(true)
        m.endComputation()
        const config: any = clone(conn.properties || {})
        config.host = loginInfo.host()
        config.user = loginInfo.username()
        config.password = loginInfo.password()

        // Connect
        connect(config, conn)
            .then(connection => {
                m.startComputation()
                pubsub.emit('connected', connection)
                show(false)
                m.endComputation()
                pubsub.once('disconnect', () => {
                    connection.close()
                    show(true)
                })
            })
            .fail(err => {
                console.log('connection failure')
                m.startComputation()
                errorMsg(err.message)
                m.endComputation()
            })
            .then(() => {
                m.startComputation()
                connecting(false)
                m.endComputation()
            })
    }

    pubsub.on('data-error', err => {
        if (err.message.indexOf('The connection does not exist') > 0) {
            pubsub.emit('reconnecting')
            login()
        }
    })

    pubsub.on('login', () => show(true))

    pubsub.on('connected', () => show(false))

    const loginOnEnter = prop => {
        return e => {
            if (e.keyCode === 13) {
                login()
            } else {
                prop(e.target.value)
            }
        }
    }

    return {
        controller() {
            // controller
        },
        view() {
            return m(
                'div',
                {
                    class: show() ? 'glass' : 'hidden',
                },
                [
                    m(
                        'div',
                        {
                            class: 'popup container form',
                        },
                        [
                            m(
                                'h2',
                                {
                                    class: 'popup-title',
                                },
                                'Connect to database'
                            ),
                            m(
                                'div',
                                {
                                    class: 'error',
                                },
                                errorMsg()
                            ),
                            m(
                                'div',
                                {
                                    class: 'form-element',
                                },
                                [
                                    m(
                                        'select',
                                        {
                                            class: 'h-fill',
                                            autofocus: 'true',
                                            onchange: selectConn,
                                        },
                                        [
                                            m(
                                                'option',
                                                {
                                                    value: '',
                                                },
                                                '-- choose conection --'
                                            ),
                                        ].concat(
                                            settings.connections.map(c => {
                                                return m(
                                                    'option',
                                                    {
                                                        value: c.name,
                                                    },
                                                    c.name
                                                )
                                            })
                                        )
                                    ),
                                ]
                            ),
                            m(
                                'div',
                                {
                                    class: 'form-element',
                                },
                                [
                                    m('input', {
                                        id: 'host',
                                        placeholder: 'Hostname',
                                        class: 'h-fill',
                                        value: loginInfo.host(),
                                        onkeyup: loginOnEnter(loginInfo.host),
                                    }),
                                ]
                            ),
                            m(
                                'div',
                                {
                                    class: 'form-element',
                                },
                                [
                                    m('input', {
                                        id: 'username',
                                        placeholder: 'Username',
                                        class: 'h-fill',
                                        value: loginInfo.username(),
                                        onkeyup: loginOnEnter(
                                            loginInfo.username
                                        ),
                                    }),
                                ]
                            ),
                            m(
                                'div',
                                {
                                    class: 'form-element',
                                },
                                [
                                    m('input', {
                                        id: 'password',
                                        class: 'h-fill',
                                        placeholder: 'Password',
                                        type: 'password',
                                        value: loginInfo.password(),
                                        onkeyup: loginOnEnter(
                                            loginInfo.password
                                        ),
                                    }),
                                ]
                            ),
                            m(
                                'div',
                                {
                                    class: 'form-element form-btn-bar',
                                },
                                [
                                    m(
                                        'button',
                                        {
                                            onclick: login,
                                            class: connecting() ? 'hidden' : '',
                                        },
                                        'Connect'
                                    ),
                                    m(
                                        'div',
                                        {
                                            class:
                                                'spinner-loader' +
                                                (connecting() ? '' : ' hidden'),
                                        },
                                        'Loading…'
                                    ),
                                ]
                            ),
                        ]
                    ),
                ]
            )
        },
    }
}
