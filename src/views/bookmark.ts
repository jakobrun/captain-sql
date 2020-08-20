import { remote } from 'electron'
import { IController } from './popupmenu'
import { join } from 'path'

interface IBookmarkItem {
    name: string
    value: string
    description: string
}
export const createBookmarkModel = (m, fs, pubsub, editor, createPopupmenu) => {
    let show = false
    const description = m.prop('')
    let bookmarks
    let nameEl
    let content
    const basePath = remote.app.getPath('userData')
    let fileName = join(basePath, '/bookmarks.json')
    const configName = el => {
        nameEl = el
    }
    const writeToFile = () => {
        fs.writeFile(fileName, JSON.stringify(bookmarks), err => {
            // TODO error handling
            console.log(err)
        })
    }
    const save = () => {
        const bookmark: IBookmarkItem = {
            name: nameEl.value.trim(),
            value: content,
            description: description(),
        }
        nameEl.value = ''
        bookmarks.push(bookmark)
        writeToFile()
        show = false
        pubsub.emit('editor-focus', {})
    }
    const showAdd = () => {
        m.startComputation()
        content = editor.getSelection() || editor.getCursorStatement()
        description(content)
        show = true
        m.endComputation()
        setTimeout(nameEl.focus.bind(nameEl), 0)
    }
    const popupController: IController<IBookmarkItem> = {
        getList: () => bookmarks || [],
        renderItem: bookmark => [
            m('div.p-menu-item-text', [
                m('div', m.trust(bookmark.highlighted[0])),
                m(
                    'div',
                    { class: 'hint-remarks p-menu-item-small' },
                    bookmark.item.value
                ),
            ]),
        ],
        itemSelected: bookmark => {
            const i = bookmarks.indexOf(bookmark)
            bookmarks.splice(i, 1)
            writeToFile()
            pubsub.emit('editor-focus', {})
        },
    }
    const listView = createPopupmenu(pubsub, popupController, m)

    pubsub.on('bookmark-add', showAdd)
    pubsub.on('bookmark-delete', listView.toggleShow)
    pubsub.on('connected', connection => {
        const settings = connection.settings()
        fileName =
            basePath +
            '/' +
            (settings.bookmarksFile || settings.name + '.bookmarks.json')
        fs.readFile(fileName, (err, data) => {
            bookmarks = err ? [] : JSON.parse(data)
            pubsub.emit('bookmarks', bookmarks)
        })
    })

    document.addEventListener('keyup', e => {
        if (e.keyCode === 27 && show) {
            m.startComputation()
            show = false
            pubsub.emit('bookmark-closed')
            m.endComputation()
        }
    })
    return {
        view() {
            return m('div', [
                m(
                    'div',
                    {
                        class: 'container popup form' + (show ? '' : ' hidden'),
                    },
                    [
                        m(
                            'h2',
                            {
                                class: 'popup-title',
                            },
                            'Add bookmark'
                        ),
                        m(
                            'div',
                            {
                                class: 'form-element',
                            },
                            [
                                m('input', {
                                    class: 'h-fill',
                                    placeholder: 'Name',
                                    config: configName,
                                    onkeyup(e) {
                                        if (e.keyCode === 13) {
                                            save()
                                        }
                                    },
                                }),
                            ]
                        ),
                        m(
                            'div',
                            {
                                class: 'form-element',
                            },
                            [
                                m('textarea', {
                                    class: 'h-fill',
                                    placeholder: 'Content',
                                    rows: '5',
                                    value: description(),
                                    onchange: m.withAttr('value', description),
                                }),
                            ]
                        ),
                    ]
                ),
                listView.view(),
            ])
        },
    }
}
