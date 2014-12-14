gandalf.createSqlClientModule = function(m, pubsub, fs, editor, connection, settings, result, bookmarkModule, actions) {
  'use strict';
  var datahandler = function(eventName) {
      return function(err, data, more) {
        m.startComputation();
        if (err) {
          pubsub.emit('error', err);
        } else {
          pubsub.emit(eventName, data);
          isMore = more;
        }
        m.endComputation();
      };
    },
    runQuery = function() {
      time = Date.now();
      m.startComputation();
      status('executing...');
      m.endComputation();

      sqlStream = connection.execute(editor.getValue(' '));

      sqlStream.metadata(datahandler('metadata'));

      sqlStream.next(datahandler('data'));

    },
    loadMore = function() {
      if (!isMore) {
        return;
      }
      sqlStream.next(datahandler('data-more'));
    },
    status = m.prop('connected!'),
    isMore = false,
    sqlStream, connSettings, time;

  pubsub.on('data', function () {
    var timeDiff = Date.now() - time;
      status('done, time: (' + timeDiff + ')');
  });
  pubsub.on('run-query', runQuery);
  pubsub.on('load-more', loadMore);
  pubsub.on('bookmark-add', function() {
    bookmarkModule.show(editor.getSelection() || editor.getValue());
  });
  pubsub.on('schema-export', function() {
    connection.exportSchemaToFile({
      schema: connSettings.schema[0].name,
      file: connSettings.schema[0].file
    });
  });

  return {
    controller: function() {
      var connName = m.route.param('conn');
      connSettings = settings.connections.filter(function(c) {
        return c.name === connName;
      })[0];
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
      status('Connected to ' + connSettings.name + '!');
    },
    view: function() {
      return [
        editor.view(),
        m('div', {
          'class': 'result-gutter'
        }),
        result.view(),
        m('div', {
          'class': 'statusbar'
        }, status()),
        actions.view(),
        bookmarkModule.view()
      ];
    }
  };
};
