exports.createActions = function(m, pubsub, createPopupmenu) {
  'use strict';
  var list = [{
      name: 'Run query (ctrl + Enter)',
      eventName: 'run-query'
    }, {
      name: 'Content assist (ctrl + Space)',
      eventName: 'content-assist'
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
      name: 'Export schema',
      eventName: 'schema-export'
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
