var jt400 = require('node-jt400'),
  q = require('q'),
  fs = require('fs'),
  JSONStream = require('JSONStream'),
  exportSchema = require('../server/export-schema');

function connection(db, settings) {
  var statement;
  return {
    settings: function() {
      return settings;
    },
    execute: function(sqlStatement) {
      var buffer = [];

      //close previous statement
      if (statement) {
        statement.close();
        statement = undefined;
      }

      return db.execute(sqlStatement).then(function(st) {
        statement = st;
        return {
          isQuery: st.isQuery,
          metadata: st.metadata,
          updated: st.updated,
          query: function() {
            var deffered = q.defer();
            var stream = st.asStream({
              bufferSize: 130
            }).pipe(JSONStream.parse([true]));

            stream.on('data', function(data) {
              buffer.push(data);
              if (buffer.length >= 131) {
                deffered.fulfill({
                  data: buffer.splice(0, 131),
                  more: function() {
                    stream.resume();
                    deffered = q.defer();
                    return deffered.promise;
                  }
                });
                stream.pause();
              }
            });

            stream.on('end', function() {
              statement = undefined;
              deffered.fulfill({
                data: buffer
              });
            });

            stream.on('error', function(err) {
              deffered.reject(err);
            });
            return deffered.promise;
          }
        };
      });
    },
    close: function () {
      db.close();
    },
    exportSchemaToFile: function(opt) {
      var stream = exportSchema(db, opt);
      stream.pipe(fs.createWriteStream(opt.file));
      stream.on('end', function() {
        console.log('shema to file done');
      });
      return stream;
    }
  };
}

module.exports = function connect(options, settings) {

  console.log('connecting...');
  if (options.host === 'hsql:inmemory') {
    var db = jt400.useInMemoryDb();
    return require('../server/fakedata')(db).then(function() {
      console.log('connected to inmemory hsql!!');
      return connection(db, settings);
    }, function() {
      //ignore error
      return connection(db, settings);
    });
  } else {
    return jt400.connect(options).then(function(conn) {
      console.log('connected!!');
      return connection(conn, settings);
    });
  }
};
