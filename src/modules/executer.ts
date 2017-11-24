export const createExecuter = function (pubsub, editor, m) {
  let more;
  let connection;

  const compute = function (fun) {
    return function () {
      m.startComputation();
      fun.apply(this, arguments);
      m.endComputation();
    };
  };
  const emit = function (eventName) {
    return compute(function (res) {
      console.log('emit', eventName);
      pubsub.emit(eventName, res);
    });
  };
  const emitData = function (eventName) {
    return compute(function (res) {
      pubsub.emit(eventName, {
        data: res.data,
        isMore: !!res.more
      });
      more = res.more;
    });
  };
  const dataHandler = emitData('data');
  const moredataHandler = emitData('data-more');
  const errorHandler = emit('data-error');
  const runQuery = function () {
    const sql = editor.getSelection() || editor.getCursorStatement();
    if(!connection) {
      return
    }
    connection.execute(sql).then(function (st) {
      if (st.isQuery()) {
        st.metadata().then(emit('metadata')).catch(errorHandler);
        st.query().then(function (res) {
          pubsub.emit('succesfull-query', {
            sql: sql,
            data: res.data
          });
          return res;
        }).then(dataHandler).catch(errorHandler);
      } else {
        st.updated().then(emit('data-updated')).catch(errorHandler);
      }
    }).catch(errorHandler);
  };
  const loadMore = function () {
    if (!more) {
      return;
    }
    more().then(moredataHandler).catch(errorHandler);
  };

  pubsub.on('connected', (c) => connection = c);
  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
};
