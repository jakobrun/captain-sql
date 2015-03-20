exports.createHistory = function (m, pubsub, createPopupmenu) {
  'use strict';
  var history = [];
  var popup = createPopupmenu(pubsub, {
    getList: function () {
      return history;
    },
    renderItem: function (historyItem) {
      return [m('div', m.trust(historyItem.string)), m('div', {'class': 'hint-remarks'}, historyItem.original.time)];
    },
    itemSelected: function (historyItem) {
      pubsub.emit('history-item-selected', historyItem);
    }
  });
  pubsub.on('history-list', popup.toggleShow);
  pubsub.on('succesfull-query', function (event) {
    var first = history[0];
    if(!first || first.name !== event.sql) {
      history.splice(0, 0, {name: event.sql, time: new Date().toISOString()});
    }
  });
  return popup;
};