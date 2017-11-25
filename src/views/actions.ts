export const createActions = function (m, pubsub, createPopupmenu) {
  var list = [{
    name: 'Run query',
    eventName: 'run-query',
    shortcut: ['Ctrl', 'Enter']
  }, {
    name: 'Content assist',
    eventName: 'content-assist',
    shortcut: ['Ctrl', 'Space']
  }, {
    name: 'New window',
    eventName: 'new-window'
  }, {
    name: 'Bookmark',
    eventName: 'bookmark-add'
  }, {
    name: 'Bookmark delete',
    eventName: 'bookmark-delete'
  }, {
    name: 'Columns select',
    eventName: 'columns-select'
  }, {
    name: 'History',
    eventName: 'history-list'
  }, {
    name: 'Export schema',
    eventName: 'schema-export'
  }, {
    name: 'Disconnect',
    eventName: 'disconnect'
  }],
    menu = createPopupmenu(pubsub, {
      getList: function () {
        return list;
      },
      itemSelected: function (action) {
        pubsub.emit(action.eventName);
      }
    }, m);

  pubsub.on('actions-toggle-show', menu.toggleShow);
  return menu;
};
