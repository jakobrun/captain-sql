import * as classnames from 'classnames'
import { createColSplitter } from './splitter'
const getElIndex = el => {
    let i = -1
    for (; el; i++) {
        el = el.previousElementSibling
    }
    return i
}
const onCellKeydown = (e: KeyboardEvent) => {
    if (e.metaKey && !e.ctrlKey && !e.altKey && e.key === 'c') {
        // don't override the copy function if there is a selection
        if (document.getSelection().toString()) {
            return
        }

        // otherwise we copy the content off the cell.
        const el = e.currentTarget as HTMLElement
        const textarea = document.createElement('textarea')
        textarea.textContent = el.textContent
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
        el.focus()
    } else if (e.key === 'ArrowRight') {
        const el = e.currentTarget as HTMLElement
        if (el.nextSibling) {
            const sibling = el.nextSibling as HTMLElement
            sibling.focus()
            e.preventDefault()
        }
    } else if (e.key === 'ArrowLeft') {
        const el = e.currentTarget as HTMLElement
        if (el.previousSibling) {
            const sibling = el.previousSibling as HTMLElement
            sibling.focus()
            e.preventDefault()
        }
    } else if (e.key === 'ArrowDown') {
        const el = e.currentTarget as HTMLElement
        const parent = el.parentNode as HTMLElement
        if (parent.nextSibling) {
            const nextParent = parent.nextSibling as HTMLElement
            if (nextParent) {
                const index = getElIndex(el)
                const nextEl = nextParent.children[index] as HTMLElement
                nextEl.focus()
                e.preventDefault()
            }
        }
    } else if (e.key === 'ArrowUp') {
        const el = e.currentTarget as HTMLElement
        const parent = el.parentNode as HTMLElement
        if (parent.previousSibling) {
            const nextParent = parent.previousSibling as HTMLElement
            if (nextParent) {
                const index = getElIndex(el)
                const nextEl = nextParent.children[index] as HTMLElement
                nextEl.focus()
                e.preventDefault()
            }
        }
    }
}
export const createResult = (m, pubsub) => {
    const metadata = m.prop([])
    const updated = m.prop('')
    const data = m.prop([])
    const running = m.prop(false)
    const errorMsg = m.prop('')
    const selectedRow = m.prop(-1)
    const selectedCol = m.prop(-1)
    pubsub.on('results-focus', () => {
        const selector =
            selectedRow() === -1
                ? '.result td'
                : `.result .col-${selectedRow()}-${selectedCol()}`
        const el = document.querySelector(selector) as HTMLElement
        if (el) {
            el.focus()
        }
    })
    const columnWidth = index => {
        const col = metadata()[index]
        return (col && col.colWidth) || 300
    }
    const scroll = e => {
        const element = e.target
        if (
            element.scrollTop + element.clientHeight + 30 >=
                element.scrollHeight &&
            element.clientHeight < element.scrollHeight
        ) {
            pubsub.emit('load-more')
        }
    }
    const reset = run => {
        return () => {
            m.startComputation()
            errorMsg('')
            updated('')
            metadata([])
            data([])
            running(run)
            m.endComputation()
        }
    }

    pubsub.on('run-query', reset(true))
    pubsub.on('connected', reset(false))
    pubsub.on('metadata', mData => {
        if (errorMsg()) {
            return
        }
        mData.map(col => {
            col.splitter = createColSplitter(m, col)
        })
        metadata(mData)
    })
    pubsub.on('data', res => {
        selectedRow(-1)
        selectedCol(-1)
        running(false)
        data(res.data)
    })
    pubsub.on('data-more', res => {
        data(data().concat(res.data))
    })
    pubsub.on('data-updated', res => {
        running(false)
        updated(
            `Success! ${res.updated} row${res.updated > 1 ? 's' : ''} affected.`
        )
    })
    pubsub.on('data-error', err => {
        running(false)
        errorMsg(err.message)
    })

    const valueToString = (value: any): string => {
        if (typeof value === 'object') {
            return JSON.stringify(value)
        }
        return value
    }

    return {
        view: () => {
            const cmdOrCtrl = process.platform === 'darwin' ? '⌘' : 'Ctrl'
            return m(
                'div',
                {
                    class: 'result table',
                },
                [
                    errorMsg() &&
                        m(
                            'div',
                            {
                                class: 'error',
                            },
                            [
                                m('div.error-icon', '✕'),
                                m('div.error-msg', errorMsg()),
                                errorMsg() === 'The connection does not exist.'
                                    ? m(
                                          'button.reconnect-btn',
                                          {
                                              config: (
                                                  element,
                                                  isInitialized
                                              ) => {
                                                  if (!isInitialized) {
                                                      element.focus()
                                                  }
                                              },
                                              onclick: () => {
                                                  errorMsg('')
                                                  pubsub.emit('reconnect')
                                              },
                                          },
                                          'Reconnect'
                                      )
                                    : undefined,
                            ]
                        ),
                    m(
                        'table',
                        {
                            class: 'table-head',
                        },
                        [
                            m(
                                'tr',
                                metadata().map((col, index) => {
                                    const columnClick = () => {
                                        const size = Math.min(
                                            3200,
                                            32 + col.precision * 9
                                        )
                                        col.colWidth =
                                            col.colWidth > 300 ? 300 : size
                                    }
                                    return m(
                                        'th',
                                        {
                                            style:
                                                'width: ' +
                                                columnWidth(index) +
                                                'px',
                                            title: col.name,
                                            onclick: columnClick,
                                        },
                                        [m('span', col.name), col.splitter()]
                                    )
                                })
                            ),
                        ]
                    ),
                    updated() && m('div.updated', updated()),
                    m('div.shortcuts', [
                        m('div.shortcut-item', [
                            m('div.shortcut-label', 'Show All Commands '),
                            m('div.shortcut-value', cmdOrCtrl + ' ⇧ P'),
                        ]),
                        m('div.shortcut-item', [
                            m('div.shortcut-label', 'Execute '),
                            m('div.shortcut-value', cmdOrCtrl + ' Enter'),
                        ]),
                        m('div.shortcut-item', [
                            m('div.shortcut-label', 'History '),
                            m('div.shortcut-value', cmdOrCtrl + ' H'),
                        ]),
                    ]),
                    m(
                        'div',
                        {
                            class: 'table-body',
                            onscroll: scroll,
                        },
                        [
                            m(
                                'table',
                                {
                                    class: 'table-body-rows',
                                },
                                data().map((row, rowIndex) => {
                                    return m(
                                        'tr',
                                        {
                                            class: classnames(
                                                selectedRow() === rowIndex &&
                                                    'row-selected'
                                            ),
                                        },
                                        row.map((value, index) => {
                                            return m(
                                                'td',
                                                {
                                                    class:
                                                        'col-' +
                                                        rowIndex +
                                                        '-' +
                                                        index,
                                                    style:
                                                        'width: ' +
                                                        columnWidth(index) +
                                                        'px',
                                                    tabindex: 0,
                                                    onkeydown: onCellKeydown,
                                                    onfocus: () => {
                                                        selectedRow(rowIndex)
                                                        selectedCol(index)
                                                    },
                                                },
                                                valueToString(value)
                                            )
                                        })
                                    )
                                })
                            ),
                        ]
                    ),
                    m(
                        'div',
                        {
                            class:
                                'spinner-loader' + (running() ? '' : ' hidden'),
                        },
                        ''
                    ),
                ]
            )
        },
    }
}
