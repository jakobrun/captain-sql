gandalf.createEditor = function (m, pubsub, codeMirror) {
  var sqlEditor = function() {
      return function(element, isInitialized) {
        if (!isInitialized) {
          cm = codeMirror(element, {
            value: '',
            mode: 'text/x-sql',
            lineNumbers: true,
            autofocus: true,
            theme: 'gandalf',
            extraKeys: {
              'Ctrl-Enter': function () {
              	pubsub.emit('run-query');
              },
              'Ctrl-Space': assist,
              'Shift-Cmd-P': function () {
                pubsub.emit('actions-toggle-show');
              }
            }
          });
          var focus = cm.focus.bind(cm);
          pubsub.on('editor-focus', focus);
          pubsub.on('run-query', focus);
          pubsub.on('bookmark-closed', focus);
          pubsub.on('content-assist', assist);
        }
      };
    },
    assist = function() {
      cm.focus();
      codeMirror.showHint(cm, null, {
        tables: tables
      });
    },
    tables = {},
    cm;

    pubsub.on('schema-loaded', function (tableArray) {
        tableArray.forEach(function (table) {
          tables[table.table] = table;
        });
	});

    return {
    	getValue: function (sep) {
    		return cm.getValue(sep);
    	},
      setValue: function (value) {
        cm.setValue(value);
      },
      setCursor: function (pos) {
        cm.setCursor(pos);
      },
      getCursorStatement: function (sep) {
        var c = cm.getCursor();
        var startLine = c.line;
        while(startLine>0) {
          if(!cm.getLine(startLine - 1)) {
            break;
          }
          startLine -= 1;
        }
        var endLine = c.line;
        while(endLine < cm.lineCount()) {
          if(!cm.getLine(endLine + 1)) {
            break;
          }
          endLine += 1;
        }
        return cm.getRange({line: startLine, ch: 0}, {line: endLine, ch: cm.getLine(endLine).length}, sep);
      },
    	getSelection: function () {
    		return cm.getSelection();
    	},
    	view: function () {
	        return m('div', {
	          config: sqlEditor(),
	          'class': 'editor'
	        });
    	}
    };
};