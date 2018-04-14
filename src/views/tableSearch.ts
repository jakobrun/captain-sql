import { IController } from './popupmenu'
interface ITable {
    name: string
    remarks: string
}
export const createTableSearch = (m, pubsub, createPopupmenu) => {
    let list: any[] = []
    const controller: IController<ITable> = {
        getList: () => list,
        itemSelected: table => {
            pubsub.emit('table-item-selected', table)
        },
        valuesToSearch: item => [item.name, item.remarks],
        renderItem: ({ highlighted }) => {
            const [table, remarks] = highlighted
            return m('div.p-menu-item-text', [
                m('div', m.trust(table)),
                m(
                    'div',
                    {
                        class: 'p-menu-item-small',
                    },
                    m.trust(remarks || '')
                ),
            ])
        },
    }
    const menu = createPopupmenu(pubsub, controller, m)

    pubsub.on('schema-loaded', tablesMap => {
        list = Object.keys(tablesMap).map(k => ({
            ...tablesMap[k],
            name: tablesMap[k].table,
        }))
    })

    pubsub.on('table-search-toggle-show', menu.toggleShow)
    return menu
}
