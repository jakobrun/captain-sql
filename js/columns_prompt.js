gandalf.createColumnsPrompt = function(m, editor, pubsub) {
  'use strict';
  var getTables = require('./js/get_tables');
  console.log('createColumnsPrompt');
  var columnList = [],
    tables = [],
    listView = gandalf.createPopupmenu(pubsub, {
      getList: function() {
        return columnList;
      },
      keyDown: function(e, item) {
        if (e.keyCode === 32 && e.ctrlKey) {
          item.checked = !item.checked;
        }
      },
      renderItem: function(item) {
        var id = item.table + '_' + item.name,
          inpAttrs = {
            'type': 'checkbox',
            'class': 'checklist-input',
            'id': id
          };
        if (item.checked) {
          inpAttrs.checked = 'checked';
        }
        return m('label', {
          'for': id
        }, [m('input', inpAttrs),
          m('div', {
            'class': 'checklist-text'
          }, [
            m('div', item.table + ' ' + item.name),
            m('div', item.remarks)
          ])
        ]);
      },
      itemSelected: function() {
        editor.replaceSelection(columnList.filter(function(c) {
          return c.checked;
        }).map(function(c) {
          return (c.alias ? (c.alias + '.') : '') + c.name;
        }).join(', '));
        pubsub.emit('editor-focus', {});
      }
    });

  pubsub.on('schema-loaded', function(tableIndex) {
    tables = tableIndex;
  });

  pubsub.on('columns-select', function() {
    editor.selectColumns();
    columnList = getTables(editor.getCursorStatement(' ') || editor.getValue(' ')).filter(function(t) {
      return tables[t[0].toUpperCase()];
    }).reduce(function(arr, t) {
      return arr.concat(tables[t[0].toUpperCase()].columns.map(function(col) {
        return {
          name: col.name,
          remarks: col.remarks,
          table: t[0].toUpperCase(),
          alias: t[1]
        };
      }));
    }, []);
    listView.toggleShow();
  });

  return listView;
};
