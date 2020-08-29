import * as classnames from 'classnames'
import { centerItem } from '../modules/centerItem'
import { ISettings, SaveSettings } from '../modules/settings'
import { createBack } from './icons/back'
import { createCopy } from './icons/copy'
import { createDelete } from './icons/delete'
import { createEditIcon } from './icons/edit'

export const createLoginModule = (
    m,
    pubsub,
    connect,
    settings: ISettings,
    saveSettings: SaveSettings
) => {
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
            .catch(err => {
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

    pubsub.on('reconnect', () => {
        pubsub.emit('reconnecting')
        login()
    })

    pubsub.on('login', () => show(true))

    pubsub.on('connected', () => show(false))

    pubsub.on('connection-updated', connection => (conn = connection))

    pubsub.on('connection-added', () => resetConn())

    const resetConn = () => {
        conn = undefined
        loginInfo.password('')
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
                    m('div', { class: errorMsg() ? ' shake-pw' : '' }, [
                        m(
                            'div.login-container',
                            settings.connections
                                .map((c, i) => {
                                    const selectItem = () => {
                                        selectConn(c)
                                        const pwEl = document.getElementById(
                                            'password'
                                        )
                                        const pos =
                                            centerItem(
                                                i,
                                                settings.connections.length + 1
                                            ) * 224
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
                                            tabindex: isHidden
                                                ? undefined
                                                : '0',
                                            onclick: selectItem,
                                            onkeydown: e => {
                                                if (e.keyCode === 13) {
                                                    selectItem()
                                                }
                                            },
                                            class:
                                                'login-item theme--' +
                                                theme +
                                                (isHidden
                                                    ? ' hide-login-item'
                                                    : ''),
                                        },
                                        [
                                            m('div.login-icon', {
                                                style: `background-image: url(${c.image ||
                                                    `images/${theme}-logo.svg`})`,
                                            }),
                                            m('div.login-text', c.name),
                                            m(
                                                'div.login-host',
                                                `${c.user}@${c.host}`
                                            ),
                                        ]
                                    )
                                })
                                .concat([
                                    m(
                                        'div',
                                        {
                                            class: classnames(
                                                'add-connection',
                                                conn && 'hide-login-item'
                                            ),
                                        },
                                        [
                                            m(
                                                'div.add-connection-icon',
                                                {
                                                    tabindex: 0,
                                                    onclick: () =>
                                                        pubsub.emit(
                                                            'add-connection'
                                                        ),
                                                    onkeydown: e => {
                                                        if (e.keyCode === 13) {
                                                            pubsub.emit(
                                                                'add-connection'
                                                            )
                                                        }
                                                    },
                                                },
                                                '＋'
                                            ),
                                        ]
                                    ),
                                ])
                        ),
                        m(
                            'div',
                            {
                                class: classnames(
                                    'login-password-container',
                                    (connecting() || !conn || !show()) &&
                                        ' hide-login-item'
                                ),
                            },
                            [
                                m(
                                    'button.login-btn',
                                    {
                                        onclick: resetConn,
                                    },
                                    [createBack(m)]
                                ),
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
                                m(
                                    'button.login-btn',
                                    {
                                        onclick: login,
                                    },
                                    [m('div', '➜')]
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
                        m(
                            'div',
                            {
                                class: classnames(
                                    'login-edit-buttons',
                                    (!conn || connecting()) && 'hide-login-item'
                                ),
                            },
                            [
                                m(
                                    'button.edit-connection',
                                    {
                                        onclick: () =>
                                            pubsub.emit(
                                                'edit-connection',
                                                conn
                                            ),
                                    },
                                    [
                                        m('div.edit-connection-icon', [
                                            createEditIcon(m),
                                        ]),
                                        m('div', 'Edit'),
                                    ]
                                ),
                                m(
                                    'button.edit-connection',
                                    {
                                        onclick: () =>
                                            pubsub.emit(
                                                'copy-connection',
                                                conn
                                            ),
                                    },
                                    [
                                        m('div.edit-connection-icon', [
                                            createCopy(m),
                                        ]),
                                        m('div', 'Copy'),
                                    ]
                                ),
                                m(
                                    'button.edit-connection',
                                    {
                                        onclick: () => {
                                            if (
                                                window.confirm(
                                                    `Are you sure you want to delete ${conn.name}?`
                                                )
                                            ) {
                                                settings.connections = settings.connections.filter(
                                                    c => c !== conn
                                                )
                                                saveSettings(settings)
                                                resetConn()
                                            }
                                        },
                                    },
                                    [
                                        m('div.edit-connection-icon', [
                                            createDelete(m),
                                        ]),
                                        m('div', 'Delete'),
                                    ]
                                ),
                            ]
                        ),
                    ]),
                ]
            )
        },
    }
}
