export const createTableSearch = (m, pubsub, createPopupmenu) => {
    let list: any[] = []
    const menu = createPopupmenu(
        pubsub,
        {
            getList: () => list,
            itemSelected: table => {
                console.log('table selected', table)
            },
        },
        m
    )

    pubsub.on('schema-loaded', tablesMap => {
        list = Object.keys(tablesMap).map(k => ({
            ...tablesMap[k],
            name: tablesMap[k].table,
        }))
    })

    pubsub.on('table-search-toggle-show', menu.toggleShow)
    return menu
}
