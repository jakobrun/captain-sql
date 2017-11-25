export const createHistoryView = (
    m,
    pubsub,
    createPopupmenu,
    createHistory
) => {
    let history
    const popup = createPopupmenu(
        pubsub,
        {
            getList: () => (history ? history.list() : []),
            renderItem: historyItem => {
                return [
                    m('div', m.trust(historyItem.string)),
                    m(
                        'div',
                        {
                            class: 'hint-remarks',
                        },
                        historyItem.original.time
                    ),
                ]
            },
            itemSelected: historyItem => {
                pubsub.emit('history-item-selected', historyItem)
            },
        },
        m
    )

    pubsub.on('history-list', popup.toggleShow)
    pubsub.on('succesfull-query', event => {
        const first = history.list()[0]
        if (!first || first.name !== event.sql) {
            const historyItem = {
                name: event.sql,
                time: new Date().toISOString(),
            }
            history.push(historyItem)
        }
    })
    pubsub.on('connected', connection => {
        createHistory(connection.settings().history).then(res => {
            history = res
        })
    })

    return popup
}
