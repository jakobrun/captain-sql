export const createSplitter = m => {
    const lastSplitterPos = localStorage.getItem('main.splitter.pos')
    if (lastSplitterPos) {
        document.body.style.setProperty(
            '--editor-height',
            lastSplitterPos + 'px'
        )
    }
    const onMove = e => {
        const y = Math.min(Math.max(30, e.pageY - 2), window.innerHeight - 30)
        localStorage.setItem('main.splitter.pos', String(y))
        document.body.style.setProperty('--editor-height', y + 'px')
    }
    const onUp = () => {
        document.removeEventListener('mouseup', onUp, false)
        document.removeEventListener('mousemove', onMove, false)
    }
    return () =>
        m('div', {
            class: 'splitter',
            onmousedown: () => {
                document.addEventListener('mouseup', onUp, false)
                document.addEventListener('mousemove', onMove, false)
            },
        })
}

export const createColSplitter = (m, col) => {
    let currentPos = 0
    const columnNameWidth = col.name && col.name.length * 12
    col.colWidth = Math.min(
        300,
        Math.max(columnNameWidth, 12 + col.precision * 9)
    )
    const onMove = e => {
        const diff = e.pageX - currentPos
        currentPos = e.pageX
        col.colWidth = Math.max(10, col.colWidth + diff)
        m.redraw()
    }
    const onUp = () => {
        document.removeEventListener('mouseup', onUp, false)
        document.removeEventListener('mousemove', onMove, false)
    }

    return () =>
        m(
            'div.resize-col',
            {
                onmousedown: (e: MouseEvent) => {
                    e.stopPropagation()
                    currentPos = e.pageX
                    document.addEventListener('mouseup', onUp, false)
                    document.addEventListener('mousemove', onMove, false)
                },
                onclick: (e: MouseEvent) => {
                    e.stopPropagation()
                },
            },
            ''
        )
}
