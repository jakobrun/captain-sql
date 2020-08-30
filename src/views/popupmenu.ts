import { IResultItem, search, ValuesToSearch } from '../modules/listSearch'
const prop = require('mithril/stream')

export const createIdGenerator = () => {
    let i = 0
    return () => {
        i++
        return 'e' + i
    }
}
export const createId = createIdGenerator()

export interface IController<I> {
    getList: () => I[]
    itemSelected: (item: I) => void
    keyDown?: (e: any, item: I) => void
    valuesToSearch?: ValuesToSearch<I>
    renderItem?: (item: IResultItem<I>) => any
    renderDetailView?: (item: IResultItem<I>) => any
}
const defaultValuesToSearch = item => [item.name]
export const createPopupmenu = <I>(pubsub, controller: IController<I>, m) => {
    let searchValue = ''
    const selectedIndex = prop(0)
    const menuId = createId()
    const show = prop(false)
    const defaultRender = item => [
        m('div.p-menu-item-text', m.trust(item.highlighted[0])),
    ]
    let searchElement
    let popupElement
    const hidePopup = e => {
        if (
            show() &&
            popupElement &&
            popupElement !== e.target &&
            !popupElement.contains(e.target)
        ) {
            toggleShow()
        }
    }

    const toggleShow = () => {
        show(!show())
        searchValue = ''
        selectedIndex(0)
        m.redraw()
        if (show()) {
            document.addEventListener('click', hidePopup)
            setTimeout(() => {
                searchElement?.focus()
            }, 300)
        } else {
            document.removeEventListener('click', hidePopup)
        }
    }
    const popupConfig = el => (popupElement = el.dom)
    const oncreate = el => {
        searchElement = el.dom
    }
    const getList = () => {
        if (!show()) {
            return []
        }
        const list = search({
            searchValue,
            list: controller.getList(),
            valuesToSearch: controller.valuesToSearch || defaultValuesToSearch,
        })
        if (selectedIndex() >= list.length) {
            selectedIndex(0)
        }
        return list.slice(0, 30)
    }
    const keyDown = e => {
        const list = getList()
        const l = list.length
        const i = selectedIndex()
        if (e.keyCode === 40 && l > 0) {
            e.preventDefault()
            selectedIndex((i + 1) % l)
            const elem: any = document.getElementById(
                menuId + '-i' + selectedIndex()
            )
            elem.scrollIntoViewIfNeeded()
        } else if (e.keyCode === 38 && l > 0) {
            e.preventDefault()
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
            controller.keyDown(e, list[selectedIndex()].item)
        }
    }
    const keyUp = e => {
        const list = getList()
        if (e.keyCode === 13 && list.length) {
            controller.itemSelected(list[selectedIndex()].item)
            toggleShow()
        }
    }
    return {
        toggleShow,
        controller,
        keyDown,
        keyUp,
        view() {
            const list = getList()
            return m(
                'div',
                {
                    oncreate: popupConfig,
                    class: 'p-menu popup' + (show() ? '' : ' hidden'),
                },
                [
                    m('div.p-menu-search-wrap', [
                        m('img', { src: 'images/search.svg' }),
                        m('input', {
                            class: 'p-menu-search',
                            placeholder: 'Search',
                            oncreate,
                            value: searchValue,
                            oninput: e => {
                                searchValue = e.target.value
                            },
                            onkeydown: keyDown,
                            onkeyup: keyUp,
                        }),
                    ]),
                    m('div.p-menu-result', [
                        m(
                            'ul',
                            {
                                class: 'p-menu-list',
                            },
                            list.map((item, index) => {
                                return m(
                                    'li',
                                    {
                                        class:
                                            'p-menu-item' +
                                            (index === selectedIndex()
                                                ? ' p-menu-item-selected'
                                                : ''),
                                        id: menuId + '-i' + index,
                                        onmouseover: () => selectedIndex(index),
                                        onclick: () => {
                                            controller.itemSelected(
                                                list[selectedIndex()].item
                                            )
                                            toggleShow()
                                        },
                                    },
                                    (controller.renderItem || defaultRender)(
                                        item
                                    )
                                )
                            })
                        ),
                        controller.renderDetailView && list[selectedIndex()]
                            ? m(
                                  'div.p-menu-detail',
                                  controller.renderDetailView(
                                      list[selectedIndex()]
                                  )
                              )
                            : undefined,
                    ]),
                ]
            )
        },
    }
}
