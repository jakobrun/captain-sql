exports.createHistoryView = function(m, pubsub, createPopupmenu, createHistory) {
  'use strict';
  var popup = createPopupmenu(pubsub, {
      getList: function() {
	return history ? history.list() : [];
      },
      renderItem: function(historyItem) {
	return [m('div', historyItem.original.name), m('div', {
          'class': 'hint-remarks'
        }, historyItem.original.time)];
      },
      itemSelected: function(historyItem) {
        pubsub.emit('history-item-selected', historyItem);
      }
    }), history;

  pubsub.on('history-list', popup.toggleShow);
  pubsub.on('succesfull-query', function(event) {
    var first = history.list()[0];
    if (!first || first.name !== event.sql) {
      var historyItem = {
        name: event.sql,
        time: new Date().toISOString()
      };
      history.push(historyItem);
    }
  });
  pubsub.on('connected', function(connection) {
    createHistory(connection.settings().history).then(function (res) {
      history = res;
    });
  });

  return popup;
};
