'use strict';
exports.createStatusbar = function(m, pubsub) {
  var status = m.prop(''),
    time,
    endTime = function() {
      var timeDiff = Date.now() - time;
      status('done, time: (' + timeDiff + ')');
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
  pubsub.on('data', endTime);
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
