export const createResult = (m, pubsub) => {
    const metadata = m.prop([])
    const updated = m.prop('')
    const data = m.prop([])
    const running = m.prop(false)
    const errorMsg = m.prop('')
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

    const columnClick = index => {
        const col = metadata()[index]
        const size = Math.min(3200, 12 + col.precision * 9)
        col.colWidth = col.colWidth > 300 ? 300 : size
    }
    pubsub.on('run-query', reset(true))
    pubsub.on('connected', reset(false))
    pubsub.on('metadata', mData => {
        if (errorMsg()) {
            return
        }
        mData.map(col => {
            col.colWidth = Math.min(300, 12 + col.precision * 9)
        })
        metadata(mData)
    })
    pubsub.on('data', res => {
        running(false)
        data(res.data)
    })
    pubsub.on('data-more', res => {
        data(data().concat(res.data))
    })
    pubsub.on('data-updated', n => {
        running(false)
        updated(n + ' rows updated!')
    })
    pubsub.on('data-error', err => {
        running(false)
        errorMsg(err.message)
    })

    return {
        view: () => {
            return m(
                'div',
                {
                    class: 'result table',
                },
                [
                    m(
                        'div',
                        {
                            class: 'error',
                        },
                        errorMsg()
                    ),
                    m('div', updated()),
                    m(
                        'table',
                        {
                            class: 'table-head',
                        },
                        [
                            m(
                                'tr',
                                metadata().map((col, index) => {
                                    return m(
                                        'th',
                                        {
                                            style:
                                                'width: ' +
                                                columnWidth(index) +
                                                'px',
                                            title: col.name,
                                            onclick: () => columnClick(index),
                                        },
                                        col.name
                                    )
                                })
                            ),
                        ]
                    ),
                    m('div.shortcuts', [
                        m('div.shortcut-item', [
                            m('div.shortcut-label', 'Show All Commands '),
                            m('div.shortcut-value', '⌘ ⇧ P'),
                        ]),
                        m('div.shortcut-item', [
                            m('div.shortcut-label', 'Execute '),
                            m('div.shortcut-value', 'Ctrl Enter'),
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
                                data().map(row => {
                                    return m(
                                        'tr',
                                        row.map((value, index) => {
                                            return m(
                                                'td',
                                                {
                                                    style:
                                                        'width: ' +
                                                        columnWidth(index) +
                                                        'px',
                                                },
                                                value
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
