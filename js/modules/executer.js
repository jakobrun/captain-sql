'use strict';
exports.createExecuter = function(pubsub, editor) {
  var compute = function (fun) {
      return function () {
        m.startComputation();
        fun.apply(this, arguments);
        m.endComputation();
      };
    },
    more,
    connection,
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
      var sql = editor.getSelection() || editor.getCursorStatement();
      connection.execute(sql).then(function (st) {
        if(st.isQuery()){
          st.metadata().then(emit('metadata')).fail(errorHandler);
          st.query().then(function (res) {
            pubsub.emit('succesfull-query', {
              sql: sql,
              data: res.data
            });
            dataHandler(res);
          }).fail(errorHandler);
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
    };

  pubsub.on('connected', function (c) {
    connection = c;
  });
  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
};
