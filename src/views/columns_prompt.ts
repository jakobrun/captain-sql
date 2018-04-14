import { IController } from './popupmenu'

interface IColumn {
    name: string
    checked: boolean
}
export const createColumnsPrompt = (
    m,
    editor,
    getTables,
    pubsub,
    createPopupmenu
) => {
    let columnList: any[] = []
    let tables: any[] = []
    const popupController: IController<IColumn> = {
        getList: () => {
            return columnList
        },
        keyDown: (e, item) => {
            if (e.keyCode === 32 && e.ctrlKey) {
                item.checked = !item.checked
            }
        },
        renderItem: ({ item, highlighted }) => {
            const inpAttrs = {
                type: 'checkbox',
                class: 'checklist-input',
                checked: item.checked ? 'checked' : undefined,
            }
            return m('div.p-menu-item-text', [
                m('label', [
                    m('input', inpAttrs),
                    m(
                        'div',
                        {
                            class: 'checklist-text',
                        },
                        m.trust(highlighted[0])
                    ),
                ]),
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
    }
    const listView = createPopupmenu(pubsub, popupController, m)

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
