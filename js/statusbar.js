gandalf.createStatusbar = function(m, pubsub) {
  'use strict';
  var status = m.prop('connected!'),
    endTime = function() {
      var timeDiff = Date.now() - time;
      status('done, time: (' + timeDiff + ')');
    },
    time;

  pubsub.on('run-query', function() {
    time = Date.now();
    m.startComputation();
    status('executing...');
    m.endComputation();
  });
  pubsub.on('data', endTime);
  pubsub.on('data-error', endTime);
  pubsub.on('connected', function (connSettings) {
    status('Connected to ' + connSettings.name + '!');
  });
  return {
    view: function() {
      return m('div', {
        'class': 'statusbar'
      }, status());
    }
  };
};
