'use strict';

module.exports = function(m, codeMirror, connection) {
  var sqlEditor = function() {
      return function(element, isInitialized) {
        if (!isInitialized) {
          cm = codeMirror(element, {
            value: 'SELECT * FROM ',
            mode: 'text/x-sql',
            lineNumbers: true,
            autofocus: true,
            theme: 'base16-dark',
            extraKeys: {
              'Ctrl-Enter': runQuery,
              'Ctrl-Space': assist
            }
          });
        }
      };
    },
    runQuery = function(editor) {
      var t = Date.now();
      errorMsg('');
      m.startComputation();
      metadata([]);
      data([]);
      status('executing...');
      m.endComputation();

      sqlStream = connection.execute(editor.getValue(' '));

      sqlStream.metadata(function (err, mData) {
      	m.startComputation();
      	if(err) {
      		errorMsg(err.message);
      	} else {
      		metadata(mData);
      	}
      	m.endComputation();
      });

      sqlStream.next(function (err, dataBuffer, more) {
      	m.startComputation();
      	var time = Date.now() - t;
      	if(err) {
      		errorMsg(err.message);
      	} else {
      		data(data().concat(dataBuffer));
      		isMore = more;
      	}
      	status('done, time: (' + time + ')');
      	m.endComputation();
      });

    },
    columnWidth = function function_name (index) {
      if (metadata()[index] && metadata()[index].precision) {
        return Math.min(300, metadata()[index].precision * 9);
      } else {
        return 300;
      }
    },
    scroll = function (e) {
    	var element = e.target;
      if (element.scrollTop + element.clientHeight + 30 >= element.scrollHeight &&
        element.clientHeight < element.scrollHeight) {
        loadMore();
      }
    },
    loadMore = function () {
      if (!isMore) {
        return;
      }
      sqlStream.next(function(err, dataBuffer, more) {
        m.startComputation();
        if (err) {
          errorMsg(err.message);
        } else {
          data(data().concat(dataBuffer));
          isMore = more;
        }
        m.endComputation();
      });
    },
    assist = function() {

    },
    metadata = m.prop([]),
    data = m.prop([]),
    status = m.prop(''),
    errorMsg = m.prop(''),
    isMore = false,
    sqlStream, cm;

  return {
    controller: function() {
    },
    view: function() {
      return [
        m('div', {
          config: sqlEditor(),
          'class': 'editor'
        }),
        m('div', {
          'class': 'result table'
        }, [
          m('div', {
            'class': 'error'
          }, errorMsg()),
          m('table', {
            'class': 'table-head'
          }, [
            m('tr', metadata().map(function (col, index) {
            	return m('th', {style: 'width: ' + columnWidth(index) + 'px',title: col.name}, col.name);
            }))
          ]),
          m('div', {'class': 'table-body', onscroll: scroll}, [
          	m('table', {'class': 'table-body-rows'}, data().map(function (row) {
          		return m('tr', row.map(function (value, index) {
          			return m('td', {style: 'width: ' + columnWidth(index) + 'px'}, value);
          		}));
          	}))
          ])
        ]),
        m('div', {'class': 'statusbar'}, status())
      ];
    }
  };
};
