import * as classnames from 'classnames'
import { remote } from 'electron'
import { IConnectionInfo, ISettings, saveSettings } from '../modules/settings'
const { dialog } = remote

export const createEditConnection = (m, pubsub, settings: ISettings) => {
    const show = m.prop(false)
    const image = m.prop()
    const name = m.prop('')
    const connectionType = m.prop('')
    const connectionTypes = ['jt400', 'postgres']
    const host = m.prop('')
    const username = m.prop('')
    const theam = m.prop('')
    const theams = ['dark-orange', 'dark-lime', 'dark-green', 'dark-blue']
    const autoCommit = m.prop(false)
    const properties = m.prop()
    const schemas = m.prop()
    let currentConn
    let nameEl
    const configName = el => {
        nameEl = el
    }
    const reset = () => {
        show(false)
        name('')
        host('')
        username('')
        image('')
        theam('dark-orange')
        autoCommit(false)
        properties([
            {
                name: m.prop(''),
                value: m.prop(''),
            },
        ])
        schemas([m.prop('')])
        currentConn = undefined
    }
    reset()
    const save = () => {
        const connection: IConnectionInfo = {
            type: connectionType(),
            name: name(),
            host: host(),
            user: username(),
            theme: theam(),
            autoCommit: autoCommit(),
            history: {
                file: host() + '.history',
                min: 200,
                max: 400,
            },
            image: image(),
            editorFile: host() + '.sql',
            properties: properties()
                .filter(p => p.name())
                .reduce((obj, prop) => {
                    obj[prop.name()] = prop.value()
                    return obj
                }, {}),
            schemas: schemas()
                .filter(s => s())
                .map(schema => ({
                    name: schema(),
                    file: schema() + '.json',
                })),
        }
        if (currentConn) {
            settings.connections = settings.connections.map(
                c => (c === currentConn ? connection : c)
            )
            pubsub.emit('connection-updated', connection)
        } else {
            settings.connections.push(connection)
            pubsub.emit('connection-added', connection)
        }
        saveSettings(settings)
        reset()
    }
    const showEdit = () => {
        show(true)
        setTimeout(nameEl.focus.bind(nameEl), 0)
    }

    const displayConnection = (conn: IConnectionInfo) => {
        connectionType(conn.type)
        name(conn.name)
        host(conn.host)
        username(conn.user)
        theam(conn.theme)
        autoCommit(conn.autoCommit || false)
        image(conn.image)
        properties(
            Object.keys(conn.properties).map(k => ({
                name: m.prop(k),
                value: m.prop(conn.properties[k]),
            }))
        )
        schemas(conn.schemas.map(schema => m.prop(schema.name)))
        showEdit()
    }

    pubsub.on('add-connection', showEdit)
    pubsub.on('copy-connection', displayConnection)
    pubsub.on('edit-connection', (conn: IConnectionInfo) => {
        currentConn = conn
        displayConnection(conn)
    })

    document.addEventListener('keyup', e => {
        if (e.keyCode === 27 && show()) {
            m.startComputation()
            reset()
            m.endComputation()
        }
    })

    const checkPropRows = () => {
        const props = properties()
        if (
            props.length > 1 &&
            !props[props.length - 2].name() &&
            !props[props.length - 1].name()
        ) {
            properties(props.slice(0, -1))
        } else if (props[props.length - 1].name()) {
            properties([
                ...props,
                {
                    name: m.prop(''),
                    value: m.prop(''),
                },
            ])
        }
    }
    const checkSchemaRows = () => {
        if (
            schemas().length > 1 &&
            !schemas()[schemas().length - 2]() &&
            !schemas()[schemas().length - 1]()
        ) {
            schemas(schemas().slice(0, -1))
        } else if (schemas()[schemas().length - 1]()) {
            schemas([...schemas(), m.prop('')])
        }
    }
    return {
        view() {
            return m(
                'div',
                {
                    class: classnames(
                        'glass',
                        show() ? 'glass-show' : 'glass-hide'
                    ),
                },
                [
                    m(
                        'div',
                        {
                            class: classnames(
                                'container popup form',
                                'theme--' + theam()
                            ),
                        },
                        [
                            m('h2.popup-title', 'Add connection'),
                            m('div.connection-base-data', [
                                m('div.connection-image', [
                                    m('div.login-icon', {
                                        onclick: () => {
                                            dialog.showOpenDialog(
                                                {
                                                    filters: [
                                                        {
                                                            name: 'images',
                                                            extensions: [
                                                                'png',
                                                                'jpg',
                                                            ],
                                                        },
                                                    ],
                                                },
                                                res => {
                                                    if (res && res[0]) {
                                                        m.startComputation()
                                                        image(res[0])
                                                        m.endComputation()
                                                    }
                                                }
                                            )
                                        },
                                        style: `background-image: url(${image() ||
                                            'images/g1.png'})`,
                                    }),
                                ]),
                                m('div.connection-base-data-inputs', [
                                    m('div.form-element', [
                                        m(
                                            'select',
                                            {
                                                class: 'h-fill',
                                                onchange: e => {
                                                    connectionType(
                                                        connectionTypes[
                                                            e.target
                                                                .selectedIndex
                                                        ]
                                                    )
                                                },
                                            },
                                            connectionTypes.map(connType =>
                                                m(
                                                    'option',
                                                    {
                                                        selected:
                                                            connType ===
                                                            connectionType(),
                                                    },
                                                    connType
                                                )
                                            )
                                        ),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Name',
                                            config: configName,
                                            value: name(),
                                            onchange: m.withAttr('value', name),
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Host',
                                            value: host(),
                                            onchange: m.withAttr('value', host),
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Username',
                                            value: username(),
                                            onchange: m.withAttr(
                                                'value',
                                                username
                                            ),
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m(
                                            'select',
                                            {
                                                class: 'h-fill',
                                                onchange: e => {
                                                    theam(
                                                        theams[
                                                            e.target
                                                                .selectedIndex
                                                        ]
                                                    )
                                                },
                                            },
                                            theams.map(th =>
                                                m(
                                                    'option',
                                                    {
                                                        selected:
                                                            th === theam(),
                                                    },
                                                    th
                                                )
                                            )
                                        ),
                                    ]),
                                    m('div', [
                                        m('input', {
                                            type: 'checkbox',
                                            checked: autoCommit(),
                                            id: 'autoCommit',
                                            onchange: e => {
                                                autoCommit(e.target.checked)
                                            },
                                        }),
                                        m(
                                            'label',
                                            {
                                                for: 'autoCommit',
                                            },
                                            'Auto Commit'
                                        ),
                                    ]),
                                ]),
                            ]),
                            m('div.container-extra pb0', [
                                m('h3.extra-title', 'Connection properties'),
                                m(
                                    'div.connection-props',
                                    properties().map(prop =>
                                        m('div.connection-prop', [
                                            m('input.connection-prop-name', {
                                                placeholder: 'Name',
                                                rows: '5',
                                                value: prop.name(),
                                                onkeyup: e => {
                                                    prop.name(e.target.value)
                                                    checkPropRows()
                                                },
                                            }),
                                            m('input.connection-prop-value', {
                                                placeholder: 'Value',
                                                rows: '5',
                                                value: prop.value(),
                                                onchange: m.withAttr(
                                                    'value',
                                                    prop.value
                                                ),
                                            }),
                                        ])
                                    )
                                ),
                                m('h3.extra-title mt1', 'Schemas'),
                                m(
                                    'div.schemas',
                                    schemas().map(schema =>
                                        m('input.schema', {
                                            placeholder: 'Name',
                                            rows: '5',
                                            value: schema(),
                                            onkeyup: e => {
                                                schema(e.target.value)
                                                checkSchemaRows()
                                            },
                                        })
                                    )
                                ),
                            ]),
                            m(
                                'button.save-connection',
                                {
                                    onclick: save,
                                },
                                'Save'
                            ),
                            m(
                                'button.cancel-connection',
                                {
                                    onclick: reset,
                                },
                                'Cancel'
                            ),
                        ]
                    ),
                ]
            )
        },
    }
}
