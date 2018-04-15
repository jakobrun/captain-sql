import { IController } from './popupmenu'

interface IColumn {
    name: string
    remarks: string
    type: string
    precision: string
    scale: string
}
interface ITable {
    name: string
    remarks: string
    columns: IColumn[]
}
const columnType = (col: IColumn): string => {
    if (col.type === 'CHAR' || col.type === 'VARCHAR') {
        return `${col.type}(${col.precision})`
    } else if (col.type === 'DECIMAL' || col.type === 'NUMERIC') {
        return `${col.type}(${col.precision}, ${col.scale})`
    }
    return col.type
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
                m('div.p-menu-item-small', m.trust(remarks || '')),
            ])
        },
        renderDetailView: ({ item }) => {
            return [
                m('h3.table-detail-title', item.name),
                m(
                    'div.table-detail-columns',
                    item.columns.map(col =>
                        m('div.table-detail-column', [
                            m('div.column-name-type', [
                                m('div.column-name', col.name),
                                m('div.column-type', columnType(col)),
                            ]),
                            m('div.p-menu-item-small', col.remarks),
                        ])
                    )
                ),
            ]
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
