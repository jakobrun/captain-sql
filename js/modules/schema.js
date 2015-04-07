'use strict';
export const createSchemaHandler = function(fs, pubsub) {
  const baseDir = process.env.HOME + '/.gandalf/';
  let connection;
  const loadSchema = function() {
    connection.settings().schema.forEach(function(schema) {
      const t = Date.now();
      fs.readFile(baseDir + schema.file, function(err, schemaContent) {
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
  };

  pubsub.on('schema-export', function() {
    const settings = connection.settings();
    connection.exportSchemaToFile({
      schema: settings.schema[0].name,
      file: baseDir + settings.schema[0].file
    }).on('end', loadSchema);
  });

  pubsub.on('connected', function (c) {
    connection = c;
    loadSchema();
  });

};
