var jt400 = require('node-jt400'),
  q = require('q'),
  fs = require('fs'),
  JSONStream = require('JSONStream'),
  exportSchema = require('../server/export-schema'),
  statement,
  db,
  connection = {
    connect: function(options) {
      console.log('connecting...');
      if (options.host === 'hsql:inmemory') {
        db = jt400.useInMemoryDb();
        return require('../server/fakedata')(db).then(function() {
          console.log('connected to inmemory hsql!!');
          return true;
        }, function() {
          //ignore error
        });
      } else {
        return jt400.connect(options).then(function(conn) {
          db = conn;
          console.log('connected!!');
          return true;
        });
      }
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
    exportSchemaToFile: function(opt) {
      var stream = exportSchema(db, opt);
      stream.pipe(fs.createWriteStream(opt.file));
      stream.on('end', function() {
        console.log('shema to file done');
      });
      return stream;
    }
  };



module.exports = connection;
