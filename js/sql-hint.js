/*global CodeMirror*/
gandalf.createSqlHint = function(pubsub, editor, getTables) {
  'use strict';

  var tables,
    keywords,
    bookmarks = [];

  pubsub.on('bookmarks', function (bookm) {
    bookmarks = bookm;
  });

  function getKeywords(cm) {
    var mode = cm.doc.modeOption;
    if(mode === "sql"){
      mode = "text/x-sql";
    }
    return CodeMirror.resolveMode(mode).keywords;
  }

  function values(obj) {
    var array = [];
    for(var key in obj){
      array.push(obj[key]);
    }
    return array;
  }

  function keys(obj) {
    var array = [];
    for(var key in obj){
      if(obj.hasOwnProperty(key)){
        array.push(key);
      }
    }
    return array;
  }

  function match(string, getter) {
    return function (obj) {
      var len = string.length;
      var sub = getter(obj).substr(0, len);
      return string.toUpperCase() === sub.toUpperCase();
    };
  }

  function columnCompletion(cm) {
    var cur = cm.getCursor(),
      token = cm.getTokenAt(cur),
      string = token.string.substr(1),
      prevCur = CodeMirror.Pos(cur.line, token.start),
      table = cm.getTokenAt(prevCur).string;
    if( !tables.hasOwnProperty( table ) ){
      table = findTableByAlias(table);
    }
    if(!tables[table]) {
      return [];
    }
    return tables[table].columns.filter(match(string, function (col) {
      return col.name;
    })).map(function(col) {
      return {
        text: "." + col.name,
        render: function (el) {
          el.innerHTML = '<div class="hint-column">'+col.name+'</div><div class="hint-remarks">' + col.remarks +'</div>';
        }
        //displayText: col.name + (col.remarks ? ' ' + col.remarks : '')
      };
    });
  }

  function findTableByAlias(alias) {
    var tableTuble = getTables(editor.getCursorStatement(' ') || editor.getValue(' ')).filter(function (table) {
      return alias === table[1];
    })[0];
    return tableTuble && tableTuble[0];
  }

  function tableAndKeywordCompletion(search) {
    var keyWordMatcher = match(search, function(w){return w;});
    var getTableName = function (table) {
      return table.table;
    };
    var tableToHint = function (table) {
      return {
        text: table.table,
        render: function (el) {
          el.innerHTML = '<div class="hint-table">' + table.table +
            '</div><div class="hint-remarks">' + table.remarks + '</div>';
        }
      };
    };

    return keys(keywords).filter(keyWordMatcher).map(function (w) {
      return {text: w.toUpperCase(), displayText: w.toUpperCase()};
    }).concat(values(tables).filter(match(search, getTableName)).map(tableToHint));

  }

  function bookmarkCompletion (search) {
    var getName = function (obj) {
      return obj.name;
    };

    return bookmarks.filter(match(search, getName)).map(function (bookmark) {
      return {
        text: bookmark.value,
        render: function (el) {
          el.innerHTML = '<div class="hint-bookmark">' + bookmark.name +
            '</div><div class="hint-remarks">' + bookmark.description + '</div>';
        }
      };
    });
  }

  function sqlHint(cm, options) {
    tables = (options && options.tables) || {};
    keywords = keywords || getKeywords(cm);
    var cur = cm.getCursor(),
      token = cm.getTokenAt(cur),
      search = token.string.trim(),
      result;
    if(search.lastIndexOf('.') === 0) {
      result = columnCompletion(cm);
    } else {
      result = tableAndKeywordCompletion(search).concat(bookmarkCompletion(search));
    }

    return {
      list: result,
        from: CodeMirror.Pos(cur.line, token.start),
        to: CodeMirror.Pos(cur.line, token.end)
    };
  }

  CodeMirror.registerHelper("hint", "sql", sqlHint);
};
