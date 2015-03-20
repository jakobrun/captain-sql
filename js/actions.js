exports.createActions = function(m, pubsub, createPopupmenu) {
  'use strict';
  var list = [{
      name: 'Run query (ctrl + Enter)',
      eventName: 'run-query'
    }, {
      name: 'Content assist (ctrl + Space)',
      eventName: 'content-assist'
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
      getList: function() {
        return list;
      },
      itemSelected: function(action) {
        pubsub.emit(action.eventName);
      }
    });

  pubsub.on('actions-toggle-show', menu.toggleShow);
  return menu;
};
