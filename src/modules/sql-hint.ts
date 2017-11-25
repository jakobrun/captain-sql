export const createSqlHint = (pubsub, editor, getTables, CodeMirror) => {
    let tables
    let keywords
    let bookmarks: any[] = []

    pubsub.on('bookmarks', bookm => (bookmarks = bookm))

    function getKeywords(cm) {
        let mode = cm.doc.modeOption
        if (mode === 'sql') {
            mode = 'text/x-sql'
        }
        return CodeMirror.resolveMode(mode).keywords
    }

    function values(obj) {
        const array: any[] = []
        Object.keys(obj).map(k => array.push(obj[k]))
        // for (const key in obj) {
        //     array.push(obj[key])
        // }
        return array
    }

    function match(str, getter) {
        return obj => {
            const len = str.length
            const sub = getter(obj).substr(0, len)
            return str.toUpperCase() === sub.toUpperCase()
        }
    }

    function findTableByAlias(alias) {
        const tableTuble = getTables(
            editor.getCursorStatement(' ') || editor.getValue(' ')
        ).filter(table => {
            return alias === table[1]
        })[0]
        return tableTuble && tableTuble[0]
    }

    function columnCompletion(cm) {
        const cur = cm.getCursor()
        const token = cm.getTokenAt(cur)
        const str = token.string.substr(1)
        const prevCur = CodeMirror.Pos(cur.line, token.start) // eslint-disable-line new-cap
        let table = cm.getTokenAt(prevCur).string
        if (!tables.hasOwnProperty(table.toUpperCase())) {
            table = findTableByAlias(table)
        }
        table = table && table.toUpperCase()
        if (!tables[table]) {
            return []
        }
        return tables[table].columns
            .filter(
                match(str, col => {
                    return col.name
                })
            )
            .map(col => {
                return {
                    text: '.' + col.name,
                    render: el => {
                        el.innerHTML =
                            '<div class="hint-column">' +
                            col.name +
                            '</div><div class="hint-remarks">' +
                            col.remarks +
                            '</div>'
                    },
                    // displayText: col.name + (col.remarks ? ' ' + col.remarks : '')
                }
            })
    }

    function tableAndKeywordCompletion(search) {
        const keyWordMatcher = match(search, w => w)
        const tableToHint = table => {
            return {
                text: table.table,
                render: el => {
                    el.innerHTML =
                        '<div class="hint-table">' +
                        table.table +
                        '</div><div class="hint-remarks">' +
                        table.remarks +
                        '</div>'
                },
            }
        }

        const res: any[] = Object.keys(keywords)
            .filter(keyWordMatcher)
            .map(w => {
                return { text: w.toUpperCase(), displayText: w.toUpperCase() }
            })
        return res.concat(
            values(tables)
                .filter(match(search, table => table.table))
                .map(tableToHint)
        )
    }

    function bookmarkCompletion(search) {
        return bookmarks
            .filter(match(search, obj => obj.name))
            .map(bookmark => {
                return {
                    text: bookmark.value,
                    render: el => {
                        el.innerHTML =
                            '<div class="hint-bookmark">' +
                            bookmark.name +
                            '</div><div class="hint-remarks">' +
                            bookmark.description +
                            '</div>'
                    },
                }
            })
    }

    function sqlHint(cm, options) {
        tables = (options && options.tables) || {}
        keywords = keywords || getKeywords(cm)
        const cur = cm.getCursor()
        const token = cm.getTokenAt(cur)
        const search = token.string.trim()
        let result
        if (search === '') {
            return
        }
        if (search.lastIndexOf('.') === 0) {
            result = columnCompletion(cm)
        } else {
            result = tableAndKeywordCompletion(search).concat(
                bookmarkCompletion(search)
            )
        }

        if (result.length === 1 && result[0].text === search) {
            return
        }

        return {
            list: result,
            /*eslint-disable new-cap*/
            from: CodeMirror.Pos(cur.line, token.start),
            to: CodeMirror.Pos(cur.line, token.end),
            /*eslint-enable*/
        }
    }

    CodeMirror.registerHelper('hint', 'sql', sqlHint)
}
