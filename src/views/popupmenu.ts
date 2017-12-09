export const createIdGenerator = () => {
    let i = 0
    return () => {
        i++
        return 'e' + i
    }
}
export const createId = createIdGenerator()
export const createPopupmenu = (pubsub, controller, m) => {
    const fuzzy = require('fuzzy')

    const searchValue = m.prop('')
    const selectedIndex = m.prop(0)
    const menuId = createId()
    const show = m.prop(false)
    let searchElement
    const toggleShow = () => {
        m.startComputation()
        show(!show())
        searchValue('')
        selectedIndex(0)
        m.endComputation()
        if (show()) {
            setTimeout(() => {
                if (searchElement) {
                    searchElement.focus()
                }
            }, 50)
        }
    }
    const config = el => {
        searchElement = el
    }
    const getList = () => {
        const list = fuzzy.filter(searchValue(), controller.getList(), {
            pre: '<span class="match">',
            post: '</span>',
            extract: item => item.name,
        })
        if (selectedIndex() >= list.length) {
            selectedIndex(0)
        }
        return list
    }
    const keyDown = e => {
        const list = getList()
        const l = list.length
        const i = selectedIndex()
        if (e.keyCode === 40 && l > 0) {
            selectedIndex((i + 1) % l)
            const elem: any = document.getElementById(
                menuId + '-i' + selectedIndex()
            )
            elem.scrollIntoViewIfNeeded()
        } else if (e.keyCode === 38 && l > 0) {
            selectedIndex((i - 1 + l) % l)
            const elem: any = document.getElementById(
                menuId + '-i' + selectedIndex()
            )
            elem.scrollIntoViewIfNeeded()
        } else if (e.keyCode === 27) {
            toggleShow()
            pubsub.emit('editor-focus', {})
        }
        if (controller.keyDown && l) {
            controller.keyDown(e, list[selectedIndex()].original)
        }
    }
    const keyUp = e => {
        const list = getList()
        if (e.keyCode === 13 && list.length) {
            controller.itemSelected(list[selectedIndex()].original)
            toggleShow()
        }
    }
    return {
        toggleShow,
        controller,
        keyDown,
        keyUp,
        view() {
            return m(
                'div',
                {
                    class: 'p-menu popup' + (show() ? '' : ' hidden'),
                },
                [
                    m('div.p-menu-search-wrap', [
                        m('img', { src: 'images/search.svg' }),
                        m('input', {
                            class: 'p-menu-search',
                            config,
                            value: searchValue(),
                            oninput: m.withAttr('value', searchValue),
                            onkeydown: keyDown,
                            onkeyup: keyUp,
                        }),
                    ]),
                    m(
                        'ul',
                        {
                            class: 'p-menu-list',
                        },
                        getList().map((item, index) => {
                            const shortcut = item.original.shortcut || []
                            return m(
                                'li',
                                {
                                    class:
                                        'p-menu-item' +
                                        (index === selectedIndex()
                                            ? ' p-menu-item-selected'
                                            : ''),
                                    id: menuId + '-i' + index,
                                },
                                [
                                    m(
                                        'div.p-menu-item-text',
                                        controller.renderItem
                                            ? controller.renderItem(item)
                                            : m.trust(item.string)
                                    ),
                                    ...shortcut.map(sc =>
                                        m('div.p-menu-shortcut', sc)
                                    ),
                                ]
                            )
                        })
                    ),
                ]
            )
        },
    }
}
