/*jshint maxparams: 10*/
exports.createColumnsPrompt = function(m, editor, getTables, pubsub, createPopupmenu) {
  'use strict';
  var columnList = [],
    tables = [],
    listView = createPopupmenu(pubsub, {
      getList: function() {
        return columnList;
      },
      keyDown: function(e, item) {
        if (e.keyCode === 32 && e.ctrlKey) {
          item.checked = !item.checked;
        }
      },
      renderItem: function(item) {
        var inpAttrs = {
          'type': 'checkbox',
          'class': 'checklist-input',
        };
        if (item.checked) {
          inpAttrs.checked = 'checked';
        }
        return m('label', [m('input', inpAttrs),
          m('div', {
            'class': 'checklist-text'
          }, item.name)
        ]);
      },
      itemSelected: function() {
        editor.replaceSelection(columnList.filter(function(c) {
          return c.checked;
        }).map(function(c) {
          return c.name;
        }).join(', '));
        pubsub.emit('editor-focus', {});
      }
    });

  pubsub.on('schema-loaded', function(tableIndex) {
    tables = tableIndex;
  });

  pubsub.on('columns-select', function() {
    var selectedColumns = editor.selectColumns(),
      getColumnLabel = function(t, col) {
        var name = t[1] ? t[1] + '.' + col.name : col.name;
        if (col.remarks) {
          name += ' "' + col.remarks + '"';
        }
        return name;
      },
      colIndex = selectedColumns.reduce(function(obj, col) {
        obj[col.toUpperCase()] = true;
        return obj;
      }, {});
    columnList = selectedColumns
      .filter(function (col) {
        return col !== '*';
      })
      .map(function(col) {
      return {
        name: col,
        checked: true
      };
    }).concat(getTables(editor.getCursorStatement(' ') || editor.getValue(' ')).filter(function(t) {
      return tables[t[0].toUpperCase()];
    }).reduce(function(arr, t) {
      return arr.concat(tables[t[0].toUpperCase()].columns
        .map(function(col) {
          return {
            name: getColumnLabel(t, col),
            checked: false
          };
        }).filter(function(col) {
          return !colIndex[col.name.toUpperCase()];
        }));
    }, []));
    listView.toggleShow();
  });

  return listView;
};
