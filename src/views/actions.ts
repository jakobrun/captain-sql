import { IController } from './popupmenu'

interface IAction {
    name: string
    eventName: string
    shortcut?: string[]
}
export const createActions = (m, pubsub, createPopupmenu) => {
    const cmdOrCtrl = process.platform === 'darwin' ? '⌘' : 'Ctrl'
    const list: IAction[] = [
        {
            name: 'Run query',
            eventName: 'run-query',
            shortcut: [cmdOrCtrl, 'Enter'],
        },
        {
            name: 'Content assist',
            eventName: 'content-assist',
            shortcut: ['Ctrl', 'Space'],
        },
        {
            name: 'Search tables',
            eventName: 'table-search-toggle-show',
            shortcut: [cmdOrCtrl, 'P'],
        },
        {
            name: 'New window',
            eventName: 'new-window',
        },
        {
            name: 'Bookmark',
            eventName: 'bookmark-add',
        },
        {
            name: 'Bookmark delete',
            eventName: 'bookmark-delete',
        },
        {
            name: 'Columns select',
            eventName: 'columns-select',
        },
        {
            name: 'History',
            eventName: 'history-list',
            shortcut: [cmdOrCtrl, 'H'],
        },
        {
            name: 'Focus Editor',
            eventName: 'editor-focus',
            shortcut: [cmdOrCtrl, '1'],
        },
        {
            name: 'Focus Results',
            eventName: 'results-focus',
            shortcut: [cmdOrCtrl, '2'],
        },
        {
            name: 'Export schema',
            eventName: 'schema-export',
        },
        {
            name: 'Commit',
            eventName: 'commit',
        },
        {
            name: 'Rollback',
            eventName: 'rollback',
        },
        {
            name: 'Disconnect',
            eventName: 'disconnect',
        },
    ]
    const controller: IController<IAction> = {
        getList: () => list,
        itemSelected: action => {
            pubsub.emit(action.eventName)
        },
        renderItem: ({ item, highlighted }) => [
            m('div.p-menu-item-text', m.trust(highlighted[0])),
            ...(item.shortcut || []).map(sc => m('div.p-menu-shortcut', sc)),
        ],
    }
    const menu = createPopupmenu(pubsub, controller, m)

    pubsub.on('actions-toggle-show', menu.toggleShow)
    return menu
}
