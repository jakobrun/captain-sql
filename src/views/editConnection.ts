import classnames from 'classnames'
import { ipcRenderer } from 'electron'
import { IConnectionInfo, ISettings, SaveSettings } from '../modules/settings'
const prop = require('mithril/stream')
export const createEditConnection = (
    m,
    pubsub,
    settings: ISettings,
    saveSettings: SaveSettings
) => {
    const show = prop(false)
    const image = prop()
    let name = ''
    const connectionType = prop('')
    const connectionTypes = ['jt400', 'postgres']
    let host = ''
    let database = ''
    let username = ''
    let bookmarks = ''
    const theam = prop('')
    const theams = ['dark-orange', 'dark-lime', 'dark-green', 'dark-blue']
    const autoCommit = prop(false)
    const ssl = prop(false)
    const properties = prop()
    const schemas = prop()
    let currentConn
    let nameEl
    const configName = el => {
        nameEl = el
    }
    const reset = () => {
        show(false)
        connectionType('jt400')
        name = ''
        host = ''
        username = ''
        database = ''
        bookmarks = ''
        image('')
        theam('dark-orange')
        autoCommit(false)
        ssl(false)
        properties([
            {
                name: '',
                value: '',
            },
        ])
        schemas([prop('')])
        currentConn = undefined
    }
    reset()
    const save = () => {
        const connection: IConnectionInfo = {
            type: connectionType(),
            name,
            host,
            user: username,
            database,
            bookmarksFile: bookmarks,
            ssl: ssl(),
            theme: theam(),
            autoCommit: autoCommit(),
            history: {
                file: host + '.history',
                min: 200,
                max: 400,
            },
            image: image(),
            properties: properties()
                .filter(p => p.name)
                .reduce((obj, property) => {
                    obj[property.name] = property.value
                    return obj
                }, {}),
            schemas: schemas()
                .filter(s => s())
                .map(schema => schema()),
        }
        if (currentConn) {
            settings.connections = settings.connections.map(c =>
                c === currentConn ? connection : c
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
        setTimeout(() => nameEl.dom.focus(), 0)
    }

    const displayConnection = (conn: IConnectionInfo) => {
        connectionType(conn.type)
        name = conn.name
        host = conn.host
        username = conn.user
        database = conn.database || ''
        bookmarks = conn.bookmarksFile || ''
        theam(conn.theme)
        autoCommit(conn.autoCommit || false)
        ssl(conn.ssl || false)
        image(conn.image)
        properties(
            Object.keys(conn.properties)
                .map(k => ({
                    name: k,
                    value: conn.properties[k],
                }))
                .concat([
                    {
                        name: '',
                        value: '',
                    },
                ])
        )
        schemas(conn.schemas.map(schema => prop(schema)).concat([prop('')]))
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
            reset()
            m.redraw()
        }
    })

    const checkPropRows = () => {
        const props = properties()
        if (
            props.length > 1 &&
            !props[props.length - 2].name &&
            !props[props.length - 1].name
        ) {
            properties(props.slice(0, -1))
        } else if (props[props.length - 1].name) {
            properties([
                ...props,
                {
                    name: '',
                    value: '',
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
            schemas([...schemas(), prop('')])
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
                                            ipcRenderer
                                                .invoke('open-dialog', {
                                                    filters: [
                                                        {
                                                            name: 'images',
                                                            extensions: [
                                                                'png',
                                                                'jpg',
                                                            ],
                                                        },
                                                    ],
                                                })
                                                .then(res => {
                                                    if (
                                                        res &&
                                                        !res.canceled &&
                                                        res.filePaths &&
                                                        res.filePaths[0]
                                                    ) {
                                                        image(res.filePaths[0])
                                                        m.redraw()
                                                    }
                                                })
                                        },
                                        style: `background-image: url(${image() ||
                                            `images/${theam()}-logo.svg`})`,
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
                                            oncreate: configName,
                                            value: name,
                                            onchange: e => {
                                                name = e.target.value
                                            },
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Host',
                                            value: host,
                                            onchange: e => {
                                                host = e.target.value
                                            },
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Database',
                                            value: database,
                                            onchange: e => {
                                                database = e.target.value
                                            },
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Bookmarks',
                                            value: bookmarks,
                                            onchange: e => {
                                                bookmarks = e.target.value
                                            },
                                        }),
                                    ]),
                                    m('div.form-element', [
                                        m('input', {
                                            class: 'h-fill',
                                            placeholder: 'Username',
                                            value: username,
                                            onchange: e => {
                                                username = e.target.value
                                            },
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
                                    connectionType() !== 'postgres'
                                        ? m('div', [
                                              m('input', {
                                                  type: 'checkbox',
                                                  checked: autoCommit(),
                                                  id: 'autoCommit',
                                                  onchange: e => {
                                                      autoCommit(
                                                          e.target.checked
                                                      )
                                                  },
                                              }),
                                              m(
                                                  'label',
                                                  {
                                                      for: 'autoCommit',
                                                  },
                                                  'Auto Commit'
                                              ),
                                          ])
                                        : undefined,
                                    connectionType() === 'postgres'
                                        ? m('div', [
                                              m('input', {
                                                  type: 'checkbox',
                                                  checked: ssl(),
                                                  id: 'ssl',
                                                  onchange: e => {
                                                      ssl(e.target.checked)
                                                  },
                                              }),
                                              m(
                                                  'label',
                                                  {
                                                      for: 'ssl',
                                                  },
                                                  'ssl'
                                              ),
                                          ])
                                        : undefined,
                                ]),
                            ]),
                            m('div.container-extra pb0', [
                                connectionType() !== 'postgres'
                                    ? m(
                                          'h3.extra-title',
                                          'Connection properties'
                                      )
                                    : undefined,
                                connectionType() !== 'postgres'
                                    ? m(
                                          'div.connection-props',
                                          properties().map(property =>
                                              m('div.connection-prop', [
                                                  m(
                                                      'input.connection-prop-name',
                                                      {
                                                          placeholder: 'Name',
                                                          rows: '5',
                                                          value: property.name,
                                                          onkeyup: e => {
                                                              property.name =
                                                                  e.target.value
                                                              checkPropRows()
                                                          },
                                                      }
                                                  ),
                                                  m(
                                                      'input.connection-prop-value',
                                                      {
                                                          placeholder: 'Value',
                                                          rows: '5',
                                                          value: property.value,
                                                          onchange: e => {
                                                              property.value =
                                                                  e.target.value
                                                          },
                                                      }
                                                  ),
                                              ])
                                          )
                                      )
                                    : undefined,
                                m(
                                    'h3.extra-title mt1',
                                    'Schemas to export for code completion'
                                ),
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
