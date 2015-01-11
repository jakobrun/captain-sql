exports.createSchemaHandler = function(fs, pubsub, connection) {
  'use strict';
  var loadSchema = function() {
    connSettings.schema.forEach(function(schema) {
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
  }, connSettings;

  pubsub.on('schema-export', function() {
    connection.exportSchemaToFile({
      schema: connSettings.schema[0].name,
      file: connSettings.schema[0].file
    }).on('end', loadSchema);
  });

  pubsub.on('connected', function (cSettings) {
  	connSettings = cSettings;
  	loadSchema();
  });

};
