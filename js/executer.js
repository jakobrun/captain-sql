exports.createExecuter = function(pubsub, editor, connection) {
  'use strict';
  var datahandler = function(eventName) {
      return function(err, data, more) {
        m.startComputation();
        if (err) {
          pubsub.emit('data-error', err);
        } else {
          pubsub.emit(eventName, data);
          isMore = more;
        }
        m.endComputation();
      };
    },
    runQuery = function() {
      sqlStream = connection.execute(editor.getSelection() || editor.getCursorStatement(' '));
      sqlStream.metadata(datahandler('metadata'));
      sqlStream.next(datahandler('data'));
    },
    loadMore = function() {
      if (!isMore) {
        return;
      }
      sqlStream.next(datahandler('data-more'));
    },
    isMore = false,
    sqlStream;

  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
};
