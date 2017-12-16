import * as classnames from 'classnames'
import { remote } from 'electron'
import { IConnectionInfo, ISettings, saveSettings } from '../modules/settings'
const { dialog } = remote

export const createEditConnection = (m, pubsub, settings: ISettings) => {
    const show = m.prop(false)
    const image = m.prop()
    const name = m.prop('')
    const host = m.prop('')
    const username = m.prop('')
    const theam = m.prop('')
    const theams = ['dark-orange', 'dark-lime', 'dark-green', 'dark-blue']
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
            name: name(),
            host: host(),
            user: username(),
            theme: theam(),
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
        name(conn.name)
        host(conn.host)
        username(conn.user)
        theam(conn.theme)
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
    return {
        view() {
            return m('div', [
                m(
                    'div',
                    {
                        class: classnames(
                            'container popup form',
                            !show() && 'hidden',
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
                                        rows: '5',
                                        value: host(),
                                        onchange: m.withAttr('value', host),
                                    }),
                                ]),
                                m('div.form-element', [
                                    m('input', {
                                        class: 'h-fill',
                                        placeholder: 'Username',
                                        rows: '5',
                                        value: username(),
                                        onchange: m.withAttr('value', username),
                                    }),
                                ]),
                                m('div.form-element', [
                                    m(
                                        'select',
                                        {
                                            class: 'h-fill',
                                            placeholder: 'Username',
                                            rows: '5',
                                            onchange: e => {
                                                theam(
                                                    theams[
                                                        e.target.selectedIndex
                                                    ]
                                                )
                                            },
                                        },
                                        theams.map(th =>
                                            m(
                                                'option',
                                                {
                                                    selected: th === theam(),
                                                },
                                                th
                                            )
                                        )
                                    ),
                                ]),
                            ]),
                        ]),
                        m('h3', 'Connection properties'),
                        m(
                            'div.connection-props',
                            properties().map(prop =>
                                m('div.connection-prop', [
                                    m('input.connection-prop-name', {
                                        placeholder: 'Name',
                                        rows: '5',
                                        value: prop.name(),
                                        onchange: m.withAttr(
                                            'value',
                                            prop.name
                                        ),
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
                                    m(
                                        'button.delete-connection-prop',
                                        {
                                            onclick: () =>
                                                properties(
                                                    properties().filter(
                                                        p => p !== prop
                                                    )
                                                ),
                                        },
                                        '❌'
                                    ),
                                ])
                            )
                        ),
                        m(
                            'button.add-button',
                            {
                                onclick: () =>
                                    properties([
                                        ...properties(),
                                        {
                                            name: m.prop(''),
                                            value: m.prop(''),
                                        },
                                    ]),
                            },
                            '＋'
                        ),
                        m('h3', 'Schemas'),
                        m(
                            'div.schemas',
                            schemas()
                                .map(schema =>
                                    m('div.schema', [
                                        m('input.schema-name', {
                                            placeholder: 'Name',
                                            rows: '5',
                                            value: schema(),
                                            onchange: m.withAttr(
                                                'value',
                                                schema
                                            ),
                                        }),
                                        m(
                                            'button.delete-schema',
                                            {
                                                onclick: () =>
                                                    schemas(
                                                        schemas().filter(
                                                            s => s !== schema
                                                        )
                                                    ),
                                            },
                                            '❌'
                                        ),
                                    ])
                                )
                                .concat([
                                    m(
                                        'button.add-button',
                                        {
                                            onclick: () =>
                                                schemas([
                                                    ...schemas(),
                                                    m.prop(''),
                                                ]),
                                        },
                                        '＋'
                                    ),
                                ])
                        ),
                        m(
                            'button.save-connection',
                            {
                                onclick: save,
                            },
                            'Save'
                        ),
                    ]
                ),
            ])
        },
    }
}
