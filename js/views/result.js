'use strict';
exports.createResult = function(m, pubsub) {
  var metadata = m.prop([]),
    updated = m.prop(''),
    data = m.prop([]),
    errorMsg = m.prop(''),
    columnWidth = function (index) {
      if (metadata()[index] && metadata()[index].precision) {
        return Math.min(300, 12 + (metadata()[index].precision * 9));
      } else {
        return 300;
      }
    },
    scroll = function(e) {
      var element = e.target;
      if (element.scrollTop + element.clientHeight + 30 >= element.scrollHeight &&
        element.clientHeight < element.scrollHeight) {
        pubsub.emit('load-more');
      }
    },
    reset = function () {
      m.startComputation();
      errorMsg('');
      updated('');
      metadata([]);
      data([]);
      m.endComputation();
    };

  pubsub.on('run-query', reset);
  pubsub.on('connected', reset);
  pubsub.on('metadata', metadata);
  pubsub.on('data', data);
  pubsub.on('data-more', function(moreData) {
    data(data().concat(moreData));
  });
  pubsub.on('data-updated', function (n) {
    updated(n + ' rows updated!');
  });
  pubsub.on('data-error', function(err) {
    errorMsg(err.message);
  });

  return {
    view: function() {
      return m('div', {
        'class': 'result table'
      }, [
        m('div', {
          'class': 'error'
        }, errorMsg()),
        m('div', updated()),
        m('table', {
          'class': 'table-head'
        }, [
          m('tr', metadata().map(function(col, index) {
            return m('th', {
              style: 'width: ' + columnWidth(index) + 'px',
              title: col.name
            }, col.name);
          }))
        ]),
        m('div', {
          'class': 'table-body',
          onscroll: scroll
        }, [
          m('table', {
            'class': 'table-body-rows'
          }, data().map(function(row) {
            return m('tr', row.map(function(value, index) {
              return m('td', {
                style: 'width: ' + columnWidth(index) + 'px'
              }, value);
            }));
          }))
        ])
      ]);
    }
  };
};
