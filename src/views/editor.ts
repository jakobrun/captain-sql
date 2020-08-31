export const createEditor = (m, pubsub, codeMirror) => {
    let tables = {}
    let cm
    let errorMark
    const assist = () => {
        cm.focus()
        codeMirror.showHint(cm, null, {
            completeSingle: false,
            tables,
        })
    }
    const sqlEditor = () => {
        return element => {
            let assistTimeoutId
            const cmdOrCtrl = process.platform === 'darwin' ? 'Cmd' : 'Ctrl'
            cm = codeMirror(element.dom, {
                value: '',
                mode: 'text/x-sql',
                lineNumbers: true,
                theme: 'captain-sql',
                keyMap: 'sublime',
                extraKeys: {
                    [cmdOrCtrl + '-Enter']: () => {
                        pubsub.emit('run-query')
                    },
                    'Ctrl-Space': assist,
                },
            })
            cm.on('change', () => {
                if (assistTimeoutId) {
                    clearTimeout(assistTimeoutId)
                }
                if (errorMark) {
                    errorMark.clear()
                }
                assistTimeoutId = setTimeout(assist, 100)
            })
            let lastRange
            cm.on('cursorActivity', () => {
                const range = getCursorStatementRange()
                const where = 'background'
                if (lastRange) {
                    for (
                        let i = lastRange.from.line;
                        i <= lastRange.to.line;
                        i++
                    ) {
                        cm.removeLineClass(i, where, 'active-statement')
                    }
                    lastRange = undefined
                }

                if (cm.getSelection() || !editor.getCursorStatement(' ')) {
                    return
                }

                for (let i = range.from.line; i <= range.to.line; i++) {
                    cm.addLineClass(i, where, 'active-statement')
                }
                lastRange = range
            })
            const focus = cm.focus.bind(cm)
            pubsub.on('editor-focus', focus)
            pubsub.on('run-query', focus)
            pubsub.on('bookmark-closed', focus)
            pubsub.on('content-assist', assist)
        }
    }
    const eachTokenUntil = (f, start?, direction?) => {
        let l = start || 0
        let tokens
        let i
        direction = direction || 1
        while (l < cm.lineCount() && l >= 0) {
            tokens = cm.getLineTokens(l)
            for (i = 0; i < tokens.length; i++) {
                if (f(tokens[i], l, i, tokens)) {
                    return
                }
            }
            l += direction
        }
    }

    pubsub.on('data-error', err => {
        const { line, start, end } = editor.getTextPos(err.message)
        if (line !== -1) {
            errorMark = cm.markText(
                { line, ch: start },
                { line, ch: end },
                { className: 'token-error' }
            )
        }
    })

    pubsub.on('history-item-selected', historyItem => {
        cm.replaceRange(historyItem.name, cm.getCursor(), cm.getCursor())
    })
    pubsub.on('table-item-selected', tableItem => {
        cm.replaceRange(tableItem.name, cm.getCursor(), cm.getCursor())
    })
    pubsub.on('schema-loaded', tableIndex => {
        tables = tableIndex
    })

    pubsub.on('connected', connection => {
        const itemId = connection.settings().name + '.editordata'
        const cursorPosItemId = connection.settings().name + '.cursorpos'
        const data = localStorage.getItem(itemId)
        if (data) {
            setTimeout(() => cm.setValue(data), 300)
        }
        const cursorData = localStorage.getItem(cursorPosItemId)
        if (cursorData) {
            setTimeout(() => cm.setCursor(JSON.parse(cursorData)), 300)
        }

        const saveState = () => {
            localStorage.setItem(itemId, cm.getValue())
            localStorage.setItem(
                cursorPosItemId,
                JSON.stringify(cm.getCursor())
            )
        }

        pubsub.once('disconnect', saveState)
        pubsub.once('reconnecting', saveState)
    })
    const getCursorStatementRange = () => {
        const c = cm.getCursor()
        let startLine = c.line
        let endLine = c.line
        while (startLine > 0 && cm.getLine(startLine - 1)) {
            startLine -= 1
        }
        while (endLine < cm.lineCount() && cm.getLine(endLine + 1)) {
            endLine += 1
        }
        return {
            from: {
                line: startLine,
                ch: 0,
            },
            to: {
                line: endLine,
                ch: cm.getLine(endLine).length,
            },
        }
    }

    const errorsRegEx = [
        /Column or global variable (\w*) not found./i,
        /(\w*) in \*LIBL type \*FILE not found./i,
        /Token (\w*) was not valid. Valid tokens:/i,
        /Column (\w*) not in table/i,
        /Keyword (\w*) not expected./i,
    ]

    const getErrorToken = (errMessage: string): string | undefined => {
        const match = errorsRegEx
            .map(regEx => errMessage.match(regEx))
            .find(res => Boolean(res && res[1]))
        return match ? match[1] : undefined
    }

    const editor = {
        getValue(sep) {
            return cm.getValue(sep)
        },
        setValue(value) {
            cm.setValue(value)
        },
        setCursor(pos) {
            cm.setCursor(pos)
        },
        insertText(text) {
            cm.replaceRange(text, cm.getCursor(), cm.getCursor())
        },
        replaceSelection(text, sel) {
            cm.replaceSelection(text, sel)
        },
        getCursorStatement(sep) {
            const range = getCursorStatementRange()
            return cm.getRange(range.from, range.to, sep)
        },
        getSelection() {
            return cm.getSelection()
        },
        selectColumns() {
            let pCount = 0
            let column = ''
            const columns: string[] = []
            let start
            const countParenthesisLevel = token => {
                if (start && token === '(') {
                    pCount += 1
                } else if (start && token === ')') {
                    pCount -= 1
                }
            }
            let startLine
            let end

            // Find start line
            eachTokenUntil(
                (token, l) => {
                    if (token.string.toUpperCase() === 'SELECT') {
                        startLine = l
                        return true
                    }
                },
                cm.getCursor().line,
                -1
            )

            // Find start and end of columns
            eachTokenUntil((token, l, i, tokens) => {
                const tValue = token.string.toUpperCase()
                countParenthesisLevel(tValue)
                if (!start && tValue === 'SELECT') {
                    start = tokens[i + 1]
                        ? {
                              line: l,
                              ch: tokens[i + 1].end,
                          }
                        : {
                              line: l + 1,
                              ch: 0,
                          }
                } else if (tValue === 'FROM' && pCount === 0) {
                    end = tokens[i - 1]
                        ? {
                              line: l,
                              ch: tokens[i - 1].start,
                          }
                        : {
                              line: l - 1,
                              ch: cm.getLine(l - 1).length,
                          }
                    return true
                } else if (start && pCount === 0 && tValue === ',') {
                    columns.push(column.trim())
                    column = ''
                } else if (start) {
                    column += token.string
                }
            }, startLine)

            if (column.trim()) {
                columns.push(column.trim())
            }

            if (start && end) {
                cm.setSelection(start, end)
            }
            return columns
        },
        getTextPos(errMessage) {
            const errorToken = getErrorToken(errMessage)
            let match = ''
            let line = -1
            let start = -1
            let end = -1
            if (!errorToken) {
                return {
                    line,
                    start,
                    end,
                }
            }
            const tokenWithoutLeadingDot = (token: string) =>
                (token.startsWith('.') ? token.substr(1) : token).toUpperCase()

            const range = getCursorStatementRange()
            eachTokenUntil((token, l) => {
                if (l > range.to.line) {
                    return true
                } else if (
                    errorToken === tokenWithoutLeadingDot(token.string)
                ) {
                    start = token.start
                    end = token.end
                    line = l
                    return true
                } else if (
                    errorToken === (match + token.string).toUpperCase()
                ) {
                    end = token.end
                    line = l
                    return true
                } else if (errorToken.startsWith(token.string.toUpperCase())) {
                    start = token.start
                    match = token.string
                } else if (
                    errorToken.startsWith((match + token.string).toUpperCase())
                ) {
                    match = match + token.string
                }
            }, range.from.line)
            return {
                line,
                start,
                end,
            }
        },
        view() {
            return m('div', {
                oncreate: sqlEditor(),
                class: 'editor',
            })
        },
    }
    return editor
}
