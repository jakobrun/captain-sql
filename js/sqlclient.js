var createSqlClientModule = function(m, codeMirror, connection) {
  'use strict';
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
              'Ctrl-Space': assist,
              'Shift-Cmd-P': actionModel.toggleShow
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

      sqlStream.metadata(function(err, mData) {
        m.startComputation();
        if (err) {
          errorMsg(err.message);
        } else {
          metadata(mData);
        }
        m.endComputation();
      });

      sqlStream.next(function(err, dataBuffer, more) {
        m.startComputation();
        var time = Date.now() - t;
        if (err) {
          errorMsg(err.message);
        } else {
          data(data().concat(dataBuffer));
          isMore = more;
        }
        status('done, time: (' + time + ')');
        m.endComputation();
      });

    },
    columnWidth = function function_name(index) {
      if (metadata()[index] && metadata()[index].precision) {
        return Math.min(300, metadata()[index].precision * 9);
      } else {
        return 300;
      }
    },
    scroll = function(e) {
      var element = e.target;
      if (element.scrollTop + element.clientHeight + 30 >= element.scrollHeight &&
        element.clientHeight < element.scrollHeight) {
        loadMore();
      }
    },
    loadMore = function() {
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
    actionModel = {
      searchValue: m.prop(''),
      selectedIndex: m.prop(0),
      show: m.prop(false),
      toggleShow: function() {
        m.startComputation();
        actionModel.show(!actionModel.show());
        m.endComputation();
        if (actionModel.show() && actionModel.searchElement) {
          actionModel.searchElement.focus();
        }
      },
      config: function(el) {
        actionModel.searchElement = el;
      },
      keyDown: function(e) {
        var l = actionModel.list.length,
          i = actionModel.selectedIndex();
        if (e.keyCode === 40) {
          actionModel.selectedIndex((i + 1) % l);
        } else if (e.keyCode === 38) {
          actionModel.selectedIndex((i - 1 + l) % l);
        } else if (e.keyCode === 27) {
          actionModel.toggleShow();
          cm.focus();
        }
      },
      keyUp: function(e) {
        var list = actionModel.getList();
        if (e.keyCode === 13 && list.length) {
          list[actionModel.selectedIndex()].run();
          actionModel.toggleShow();
          cm.focus();
        }
      },
      getList: function() {
        return actionModel.list.filter(function(item) {
          return item.name.toLowerCase().indexOf(actionModel.searchValue().toLowerCase()) !== -1;
        });
      },
      list: [{
        name: 'Run query (ctrl + Enter)',
        run: function() {
          runQuery(cm);
        }
      }, {
        name: 'Content assist (ctrl + Space)',
        run: assist
      }, {
        name: 'Export schema',
        run: assist
      }, ]
    },
    metadata = m.prop([]),
    data = m.prop([]),
    status = m.prop('connected!'),
    errorMsg = m.prop(''),
    isMore = false,
    sqlStream, cm;

  return {
    controller: function() {},
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
            m('tr', metadata().map(function(col, index) {
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
            }, data().map(function(row) {
              return m('tr', row.map(function(value, index) {
                return m('td', {
                  style: 'width: ' + columnWidth(index) + 'px'
                }, value);
              }));
            }))
          ])
        ]),
        m('div', {
          'class': 'statusbar'
        }, status()),
        m('div', {
          'class': 'p-menu' + (actionModel.show() ? '' : ' hidden')
        }, [
          m('input', {
            'class': 'p-menu-search',
            config: actionModel.config,
            value: actionModel.searchValue(),
            oninput: m.withAttr('value', actionModel.searchValue),
            onkeydown: actionModel.keyDown,
            onkeyup: actionModel.keyUp
          }),
          m('ul', {
            'class': 'p-menu-list'
          }, actionModel.getList().map(function(item, index) {
            return m('li', {
              'class': 'p-menu-item' + (index === actionModel.selectedIndex() ? ' p-menu-item-selected' : '')
            }, item.name);
          }))
        ])
      ];
    }
  };
};
