/*global CodeMirror*/
function createSqlHint(pubsub) {
  'use strict';

  var tables,
    keywords,
    bookmarks = [],
    CONS = {
      QUERY_DIV: ";",
      ALIAS_KEYWORD: "AS"
    };

  pubsub.on('bookmarks', function (bookm) {
    bookmarks = bookm;
  });

  function getKeywords(editor) {
    var mode = editor.doc.modeOption;
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

  function eachUntil (array, f) {
    for(var i=0; i < array.length; i++) {
      if(!f(array[i])){
        break;
      }
    }
  }

  function match(string, getter) {
    return function (obj) {
      var len = string.length;
      var sub = getter(obj).substr(0, len);
      return string.toUpperCase() === sub.toUpperCase();
    };
  }

  function columnCompletion(editor) {
    var cur = editor.getCursor(),
      token = editor.getTokenAt(cur),
      string = token.string.substr(1),
      prevCur = CodeMirror.Pos(cur.line, token.start),
      table = editor.getTokenAt(prevCur).string;
    if( !tables.hasOwnProperty( table ) ){
      table = findTableByAlias(table, editor);
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

  function eachWord(lineText, f) {
    if( !lineText ){return;}
    var excepted = /[,;]/g;
    var words = lineText.split( " " );
    for( var i = 0; i < words.length; i++ ){
      f( words[i]?words[i].replace( excepted, '' ) : '' );
    }
  }

  function convertCurToNumber( cur ){
    // max characters of a line is 999,999.
    return cur.line + cur.ch / Math.pow( 10, 6 );
  }

  function convertNumberToCur( num ){
    return CodeMirror.Pos(Math.floor( num ), +num.toString().split( '.' ).pop());
  }

  function findTableByAlias(alias, editor) {
    var doc = editor.doc,
      fullQuery = doc.getValue(),
      aliasUpperCase = alias.toUpperCase(),
      previousWord = "",
      table = "",
      separator = [],
      validRange = {
        start: CodeMirror.Pos( 0, 0 ),
        end: CodeMirror.Pos( editor.lastLine(), editor.getLineHandle( editor.lastLine() ).length )
      };

    //add separator
    var indexOfSeparator = fullQuery.indexOf( CONS.QUERY_DIV );
    while( indexOfSeparator !== -1 ){
      separator.push( doc.posFromIndex(indexOfSeparator));
      indexOfSeparator = fullQuery.indexOf( CONS.QUERY_DIV, indexOfSeparator+1);
    }
    separator.unshift( CodeMirror.Pos( 0, 0 ) );
    separator.push( CodeMirror.Pos( editor.lastLine(), editor.getLineHandle( editor.lastLine() ).text.length ) );

    //find valieRange
    var prevItem = 0;
    var current = convertCurToNumber( editor.getCursor() );
    eachUntil(separator, function (sep) {
      var _v = convertCurToNumber( sep );
      if( current > prevItem && current <= _v ){
        validRange = { start: convertNumberToCur( prevItem ), end: convertNumberToCur( _v ) };
        return false;
      }
      prevItem = _v;
      return true;
    });

    var query = doc.getRange(validRange.start, validRange.end, false);

    eachUntil(query, function (lineText) {
      eachWord( lineText, function( word ){
        var wordUpperCase = word.toUpperCase();
        if( wordUpperCase === aliasUpperCase && tables.hasOwnProperty( previousWord ) ){
            table = previousWord;
        }
        if( wordUpperCase !== CONS.ALIAS_KEYWORD ){
          previousWord = word;
        }
      });
      return !table;
    });
    return table;
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

  function sqlHint(editor, options) {
    tables = (options && options.tables) || {};
    keywords = keywords || getKeywords(editor);
    var cur = editor.getCursor(),
      token = editor.getTokenAt(cur),
      search = token.string.trim(),
      result;
    if(search.lastIndexOf('.') === 0) {
      result = columnCompletion(editor);
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
}
