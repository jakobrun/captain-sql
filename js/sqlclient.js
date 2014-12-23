gandalf.createSqlClientModule = function(m, pubsub, fs, editor, connection, settings, result, statusbar, bookmarkModule, actions) {
  'use strict';
  var datahandler = function(eventName) {
      return function(err, data, more) {
        m.startComputation();
        if (err) {
          pubsub.emit('data-error', err);
        } else {
          pubsub.emit(eventName, data);
          isMore = more;
        }
        m.endComputation();
      };
    },
    runQuery = function() {
      time = Date.now();

      sqlStream = connection.execute(editor.getSelection() || editor.getCursorStatement(' '));

      sqlStream.metadata(datahandler('metadata'));

      sqlStream.next(datahandler('data'));

    },
    loadMore = function() {
      if (!isMore) {
        return;
      }
      sqlStream.next(datahandler('data-more'));
    },
    loadSchema = function() {
      connSettings.schema.forEach(function(schema) {
        var t = Date.now();
        fs.readFile(schema.file, function(err, schemaContent) {
          console.log('Load schema:', (Date.now() - t));
          if (err) {
            console.log(err);
          } else {
            pubsub.emit('schema-loaded', JSON.parse(schemaContent));
          }
        });
      });
    },
    isMore = false,
    sqlStream, connSettings, time;

  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
  pubsub.on('schema-export', function() {
    connection.exportSchemaToFile({
      schema: connSettings.schema[0].name,
      file: connSettings.schema[0].file
    }).on('end', loadSchema);
  });

  return {
    controller: function() {
      var connName = m.route.param('conn');
      connSettings = settings.connections.filter(function(c) {
        return c.name === connName;
      })[0];
      loadSchema();
      pubsub.emit('connected', connSettings);
    },
    view: function() {
      return [
        editor.view(),
        m('div', {
          'class': 'result-gutter'
        }),
        result.view(),
        statusbar.view(),
        actions.view(),
        bookmarkModule.view()
      ];
    }
  };
};
