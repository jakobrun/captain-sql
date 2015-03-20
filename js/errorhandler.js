exports.createErrorHandler = function (m) {
  'use strict';
  var message;
  process.on('uncaughtException', function(err) {
    console.log('Caught exception: ', err.message, err.stack);
    message = err.message;
    m.redraw(true);
  });

  document.addEventListener('keyup', function (e) {
    if(e.keyCode === 27 && message) {
      message = undefined;
      m.redraw(true);
    }
  });

  return {
    view: function () {
      return m('div', {'class': 'container popup' + (message ? '' : ' hidden')}, [
        m('h2', {
          'class': 'popup-title'
        }, 'Ups... '),
        m('p', 'Unexpected error occurred. It is probably best to restart.'),
        m('p', 'Message: ' + message)
      ]);
    }
  };
};