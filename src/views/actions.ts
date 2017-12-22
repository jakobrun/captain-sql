export const createActions = (m, pubsub, createPopupmenu) => {
    const cmdOrCtrl = process.platform === 'darwin' ? '⌘' : 'Ctrl'
    const list = [
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
    const menu = createPopupmenu(
        pubsub,
        {
            getList: () => list,
            itemSelected: action => {
                pubsub.emit(action.eventName)
            },
        },
        m
    )

    pubsub.on('actions-toggle-show', menu.toggleShow)
    return menu
}
