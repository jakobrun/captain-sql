exports.createSchemaHandler = function(fs, pubsub) {
  'use strict';
  var loadSchema = function() {
    connection.settings().schema.forEach(function(schema) {
      var t = Date.now();
      fs.readFile(schema.file, function(err, schemaContent) {
        console.log('Load schema:', (Date.now() - t));
        if (err) {
          console.log(err);
        } else {
          pubsub.emit('schema-loaded', JSON.parse(schemaContent).reduce(function(obj, table) {
            obj[table.table] = table;
            return obj;
          }, {}));
        }
      });
    });
  }, connection;

  pubsub.on('schema-export', function() {
    var settings = connection.settings();
    connection.exportSchemaToFile({
      schema: settings.schema[0].name,
      file: settings.schema[0].file
    }).on('end', loadSchema);
  });

  pubsub.on('connected', function (c) {
    connection = c;
  	loadSchema();
  });

};
