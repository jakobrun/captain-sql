export const createStatusbar = function(m, pubsub) {
  let rowCount = 0, time;
  const status = m.prop(''),
    getRowsText = function(res) {
        if(res.data && res.data.length) {
            rowCount += res.data.length;
            return ', ' + (res.isMore ? 'more than ' : '') + rowCount + ' rows';
        }
        return '';
    },
    endTime = function(res) {
      time = Date.now() - time;
      rowCount = 0;
      status('time: ' + time + 'ms' + getRowsText(res));
    };

  function setStatus (text) {
    m.startComputation();
    status(text);
    m.endComputation();
  }

  pubsub.on('run-query', function() {
    time = Date.now();
    setStatus('executing...');
  });
  pubsub.on('reconnecting', () => setStatus('reconnecting...'));
  pubsub.on('data', endTime);
  pubsub.on('data-more', function(res) {
      status('time: ' + time + 'ms' + getRowsText(res));
  });
  pubsub.on('data-error', endTime);
  pubsub.on('schema-loaded', function () {
    setStatus('Schema loaded !');
  });
  return {
    view: function() {
      return m('div', {
        'class': 'statusbar'
      }, status());
    }
  };
};
