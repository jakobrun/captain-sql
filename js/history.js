exports.createHistory = function(m, pubsub, createPopupmenu, fs) {
  'use strict';
  var history = [],
    seperator = '\n____HL____\n',
    popup = createPopupmenu(pubsub, {
      getList: function() {
        return history;
      },
      renderItem: function(historyItem) {
        return [m('div', m.trust(historyItem.string)), m('div', {
          'class': 'hint-remarks'
        }, historyItem.original.time)];
      },
      itemSelected: function(historyItem) {
        pubsub.emit('history-item-selected', historyItem);
      }
    }), settings;

  function readHistory () {
    if(settings.historyFile) {
      fs.readFile(settings.historyFile, function (err, data) {
        if(err){
          console.log('faild to read history file', err.message);
          pubsub.emit('error', err);
        } else {
          //console.log(data.toString());
          history = data.toString().split(seperator).filter(function (item) {
            return item !== '';
          }).map(JSON.parse).reverse();
        }
      });
    }
  }
  pubsub.on('history-list', popup.toggleShow);
  pubsub.on('succesfull-query', function(event) {
    var first = history[0];
    if (!first || first.name !== event.sql) {
      var historyItem = {
        name: event.sql,
        time: new Date().toISOString()
      };
      history.splice(0, 0, historyItem);
      if(settings.historyFile) {
        fs.appendFile(settings.historyFile, JSON.stringify(historyItem) + seperator, function (err) {
          if(err) {
            console.log('faild to write to history file', err.message);
            pubsub.emit('error', err);
          }
        });
      }
    }
  });
  pubsub.on('connected', function(connection) {
    settings = connection.settings();
    readHistory();
  });

  return popup;
};
