import { centerItem } from '../modules/centerItem'

export const createLoginModule = (m, pubsub, connect, settings) => {
    const connecting = m.prop(false)
    const show = m.prop(true)
    const errorMsg = m.prop('')
    const loginInfo = {
        password: m.prop(''),
    }
    let conn

    const selectConn = c => {
        conn = c
    }

    const clone = obj => {
        return Object.keys(obj).reduce((newObj, key) => {
            newObj[key] = obj[key]
            return newObj
        }, {})
    }

    const login = () => {
        m.startComputation()
        errorMsg('')
        connecting(true)
        m.endComputation()
        const config: any = clone(conn.properties || {})
        config.host = conn.host
        config.user = conn.user
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
                    resetConn()
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

    const resetConn = () => {
        conn = undefined
        document.body.style.setProperty('--login-pos', '0px')
        const el = document.querySelector('.login-item') as HTMLElement
        if (el) {
            setTimeout(() => el.focus(), 1)
        }
    }

    const loginOnEnter = e => {
        if (e.keyCode === 13) {
            login()
        } else if (e.keyCode === 27) {
            resetConn()
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
                    class: 'glass' + (show() ? '' : ' glass-hide'),
                },
                [
                    m(
                        'div.login-container',
                        settings.connections.map((c, i) => {
                            const selectItem = () => {
                                selectConn(c)
                                const pwEl = document.getElementById('password')
                                const pos =
                                    centerItem(i, settings.connections.length) *
                                    224
                                document.body.style.setProperty(
                                    '--login-pos',
                                    pos + 'px'
                                )
                                if (pwEl) {
                                    setTimeout(() => pwEl.focus(), 1)
                                }
                            }
                            const isHidden = conn && conn !== c
                            const theme = c.theme || 'dark-orange'
                            return m(
                                'div',
                                {
                                    tabindex: isHidden ? undefined : '0',
                                    onclick: selectItem,
                                    onkeydown: e => {
                                        if (e.keyCode === 13) {
                                            selectItem()
                                        }
                                    },
                                    class:
                                        'login-item theme--' +
                                        theme +
                                        (isHidden ? ' hide-login-item' : ''),
                                },
                                [
                                    m('div.login-icon', {
                                        style: `background-image: url(${c.image ||
                                            'images/g1.png'})`,
                                    }),
                                    m('div.login-text', c.name),
                                    m('div.login-host', `${c.user}@${c.host}`),
                                ]
                            )
                        })
                    ),
                    m(
                        'div',
                        {
                            class:
                                'login-password-container' +
                                (connecting() || !conn || !show()
                                    ? ' hide-login-item'
                                    : ''),
                        },
                        [
                            m(
                                'div',
                                {
                                    class:
                                        'form-element' +
                                        (errorMsg() ? ' shake-pw' : ''),
                                },
                                [
                                    m('input', {
                                        id: 'password',
                                        class: '',
                                        placeholder: 'Password',
                                        type: 'password',
                                        value: loginInfo.password(),
                                        oninput: m.withAttr(
                                            'value',
                                            loginInfo.password
                                        ),
                                        onkeydown: loginOnEnter,
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
                                        'button.login-btn',
                                        {
                                            onclick: login,
                                        },
                                        '➜'
                                    ),
                                ]
                            ),
                        ]
                    ),
                    m(
                        'div',
                        {
                            class:
                                'login-spinner-container' +
                                (connecting() ? '' : ' hide-login-item'),
                        },
                        [m('div.spinner-loader', 'Loading…')]
                    ),
                ]
            )
        },
    }
}
