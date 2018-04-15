import { IResultItem, search, ValuesToSearch } from '../modules/listSearch'
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
}
const defaultValuesToSearch = item => [item.name]
export const createPopupmenu = <I>(pubsub, controller: IController<I>, m) => {
    const searchValue = m.prop('')
    const selectedIndex = m.prop(0)
    const menuId = createId()
    const show = m.prop(false)
    const defaultRender = item => [
        m('div.p-menu-item-text', m.trust(item.highlighted[0])),
    ]
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
        const list = search({
            searchValue: searchValue(),
            list: controller.getList(),
            valuesToSearch: controller.valuesToSearch || defaultValuesToSearch,
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
                        (show() ? getList() : [])
                            .slice(0, 30)
                            .map((item, index) => {
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
                                    (controller.renderItem || defaultRender)(
                                        item
                                    )
                                )
                            })
                    ),
                ]
            )
        },
    }
}
