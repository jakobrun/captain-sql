export const createColumnsPrompt = (
    m,
    editor,
    getTables,
    pubsub,
    createPopupmenu
) => {
    let columnList: any[] = []
    let tables: any[] = []
    const listView = createPopupmenu(
        pubsub,
        {
            getList: () => {
                return columnList
            },
            keyDown: (e, item) => {
                if (e.keyCode === 32 && e.ctrlKey) {
                    item.checked = !item.checked
                }
            },
            renderItem: item => {
                const inpAttrs = {
                    type: 'checkbox',
                    class: 'checklist-input',
                    checked: item.original.checked ? 'checked' : undefined,
                }
                return m('label', [
                    m('input', inpAttrs),
                    m(
                        'div',
                        {
                            class: 'checklist-text',
                        },
                        m.trust(item.string)
                    ),
                ])
            },
            itemSelected() {
                editor.replaceSelection(
                    columnList
                        .filter(c => c.checked)
                        .map(c => c.name)
                        .join(', ')
                )
                pubsub.emit('editor-focus', {})
            },
        },
        m
    )

    pubsub.on('schema-loaded', tableIndex => {
        tables = tableIndex
    })

    pubsub.on('columns-select', () => {
        const selectedColumns: any[] = editor.selectColumns()
        const getColumnLabel = (t, col) => {
            let name = t[1] ? t[1] + '.' + col.name : col.name
            if (col.remarks) {
                name += ' "' + col.remarks + '"'
            }
            return name
        }
        const colIndex = selectedColumns.reduce((obj, col) => {
            obj[col.toUpperCase()] = true
            return obj
        }, {})
        columnList = selectedColumns
            .filter(col => col !== '*')
            .map(col => ({
                name: col,
                checked: true,
            }))
            .concat(
                getTables(
                    editor.getCursorStatement(' ') || editor.getValue(' ')
                )
                    .filter(t => tables[t[0].toUpperCase()])
                    .reduce(
                        (arr, t) =>
                            arr.concat(
                                tables[t[0].toUpperCase()].columns
                                    .map(col => ({
                                        name: getColumnLabel(t, col),
                                        checked: false,
                                    }))
                                    .filter(
                                        col => !colIndex[col.name.toUpperCase()]
                                    )
                            ),
                        []
                    )
            )
        listView.toggleShow()
    })

    return listView
}
