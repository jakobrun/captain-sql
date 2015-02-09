exports.createExecuter = function(pubsub, editor, connection) {
  'use strict';
  var compute = function (fun) {
      return function () {
        m.startComputation();
        fun.apply(this, arguments);
        m.endComputation();
      };
    },
    emit = function (eventName) {
      return compute(function (res) {
        console.log('emit', eventName);
        pubsub.emit(eventName, res);
      });
    },
    emitData = function (eventName) {
      return compute(function (res) {
        pubsub.emit(eventName, res.data);
        more = res.more;
      });
    },
    dataHandler = emitData('data'),
    moredataHandler = emitData('data-more'),
    errorHandler = emit('data-error'),
    runQuery = function() {
      connection.execute(editor.getSelection() || editor.getCursorStatement(' ')).then(function (st) {
        if(st.isQuery()){
          st.metadata().then(emit('metadata')).fail(errorHandler);
          st.query().then(dataHandler).fail(errorHandler);
        } else {
          st.updated().then(emit('data-updated')).fail(errorHandler);
        }
      }).fail(errorHandler);
    },
    loadMore = function() {
      if (!more) {
        return;
      }
      more().then(moredataHandler).fail(errorHandler);
    },
    more;

  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
};
