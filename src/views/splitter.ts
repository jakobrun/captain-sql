export const createSplitter = m => {
    let mouseDown = false
    document.addEventListener('mouseup', () => (mouseDown = false))
    document.addEventListener('mousemove', e => {
        if (!mouseDown) {
            return
        }
        const y = Math.min(Math.max(30, e.pageY - 2), window.innerHeight - 30)
        document.body.style.setProperty('--editor-height', y + 'px')
    })
    return () =>
        m('div', {
            class: 'splitter',
            onmousedown: () => (mouseDown = true),
        })
}
