'use strict';
exports.createResult = function (m, pubsub) {
  const metadata = m.prop([]),
    updated = m.prop(''),
    data = m.prop([]),
    running = m.prop(false),
    errorMsg = m.prop(''),
    columnWidth = function (index) {
      if (metadata()[index] && metadata()[index].precision) {
        return Math.min(300, 12 + (metadata()[index].precision * 9));
      } else {
        return 300;
      }
    },
    scroll = function (e) {
      const element = e.target;
      if (element.scrollTop + element.clientHeight + 30 >= element.scrollHeight &&
        element.clientHeight < element.scrollHeight) {
        pubsub.emit('load-more');
      }
    },
    reset = function (run) {
      return function () {
        m.startComputation();
        errorMsg('');
        updated('');
        metadata([]);
        data([]);
        running(run);
        m.endComputation();
      };
    };

  pubsub.on('run-query', reset(true));
  pubsub.on('connected', reset(false));
  pubsub.on('metadata', metadata);
  pubsub.on('data', function (res) {
    console.log('got data', res)
    running(false);
    data(res.data);
  });
  pubsub.on('data-more', function (res) {
    data(data().concat(res.data));
  });
  pubsub.on('data-updated', function (n) {
    running(false);
    updated(n + ' rows updated!');
  });
  pubsub.on('data-error', function (err) {
    running(false);
    errorMsg(err.message);
  });

  return {
    view: function () {
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
              m('tr', metadata().map(function (col, index) {
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
              }, data().map(function (row) {
                return m('tr', row.map(function (value, index) {
                  return m('td', {
                    style: 'width: ' + columnWidth(index) + 'px'
                  }, value);
                }));
              }))
            ]),
          m('div', { 'class': 'spinner-loader' + (running() ? '' : ' hidden') }, '')
        ]);
    }
  };
};
