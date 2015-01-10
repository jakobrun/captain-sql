gandalf.createEditor = function(m, pubsub, codeMirror) {
  var sqlEditor = function() {
      return function(element, isInitialized) {
        if (!isInitialized) {
          cm = codeMirror(element, {
            value: '',
            mode: 'text/x-sql',
            lineNumbers: true,
            autofocus: true,
            theme: 'gandalf',
            keyMap: 'sublime',
            extraKeys: {
              'Ctrl-Enter': function() {
                pubsub.emit('run-query');
              },
              'Ctrl-Space': assist,
              'Shift-Cmd-P': function() {
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
    eachTokenUntil = function(f, start, direction) {
      var l = start || 0,
        tokens, i;
      direction = direction || 1;
      while (l < cm.lineCount()) {
        tokens = cm.getLineTokens(l);
        for (i = 0; i < tokens.length; i++) {
          if (f(tokens[i], l, i, tokens)) {
            return;
          }
        }
        l += direction;
      }
    },
    tables = {},
    cm;

  pubsub.on('schema-loaded', function(tableIndex) {
    tables = tableIndex;
  });

  return {
    getValue: function(sep) {
      return cm.getValue(sep);
    },
    setValue: function(value) {
      cm.setValue(value);
    },
    setCursor: function(pos) {
      cm.setCursor(pos);
    },
    insertText: function(text) {
      cm.replaceRange(text, cm.getCursor(), cm.getCursor());
    },
    replaceSelection: function(text, sel) {
      cm.replaceSelection(text, sel);
    },
    getCursorStatement: function(sep) {
      var c = cm.getCursor(),
        startLine = c.line,
        endLine = c.line;
      while (startLine > 0 && cm.getLine(startLine - 1)) {
        startLine -= 1;
      }
      while (endLine < cm.lineCount() && cm.getLine(endLine + 1)) {
        endLine += 1;
      }
      return cm.getRange({
        line: startLine,
        ch: 0
      }, {
        line: endLine,
        ch: cm.getLine(endLine).length
      }, sep);
    },
    getSelection: function() {
      return cm.getSelection();
    },
    selectColumns: function() {
      var pCount = 0,
        column = '',
        columns = [],
        startLine, start, end;

      //Find start line
      eachTokenUntil(function (token, l) {
        if(token.string.toUpperCase() === 'SELECT') {
          startLine = l;
          return true;
        }
      }, cm.getCursor().line, -1);

      //Find start and end of columns
      eachTokenUntil(function(token, l, i, tokens) {
        var tValue = token.string.toUpperCase();
        if (start && tValue === '(') {
          column += token.string;
          pCount += 1;
        } else if (start && tValue === ')') {
          column += token.string;
          pCount -= 1;
        } else if (!start && tValue === 'SELECT') {
          start = tokens[i + 1] ? {
            line: l,
            ch: tokens[i + 1].end
          } : {
            line: l + 1,
            ch: 0
          };
        } else if (tValue === 'FROM' && pCount === 0) {
          end = tokens[i - 1] ? {
            line: l,
            ch: tokens[i - 1].start
          } : {
            line: l - 1,
            ch: cm.getLine(l - 1).length
          };
          return true;
        } else if(start && pCount === 0 && tValue === ',') {
          columns.push(column.trim());
          column = '';
        } else if(start){
          column += token.string;
        }
      }, startLine);

      columns.push(column.trim());

      if (start && end) {
        cm.setSelection(start, end);
      }
      return columns;
    },
    view: function() {
      return m('div', {
        config: sqlEditor(),
        'class': 'editor'
      });
    }
  };
};
