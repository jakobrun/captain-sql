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