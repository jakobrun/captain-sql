import * as moment from 'moment'
import { IController } from './popupmenu'

interface IHistoryItem {
    name: string
    updated?: number
    time: string
}
export const createHistoryView = (
    m,
    pubsub,
    createPopupmenu,
    createHistory
) => {
    let history
    const controller: IController<IHistoryItem> = {
        getList: () => (history ? history.list() : []),
        renderItem: ({ item, highlighted }) => {
            return m('div.p-menu-item-text', [
                m('div', m.trust(highlighted[0])),
                m(
                    'div',
                    {
                        class: 'p-menu-item-small',
                    },
                    `${moment(item.time).fromNow()}${
                        item.updated !== undefined
                            ? `. ${item.updated} row${
                                  item.updated > 1 ? 's' : ''
                              } affected.`
                            : ''
                    }`
                ),
            ])
        },
        itemSelected: historyItem => {
            pubsub.emit('history-item-selected', historyItem)
        },
    }
    const popup = createPopupmenu(pubsub, controller, m)

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
    pubsub.on('data-updated', event => {
        const historyItem = {
            name: event.sql,
            updated: event.updated,
            time: new Date().toISOString(),
        }
        history.push(historyItem)
    })
    pubsub.on('connected', connection => {
        createHistory(connection.settings().history).then(res => {
            history = res
        })
    })

    return popup
}
