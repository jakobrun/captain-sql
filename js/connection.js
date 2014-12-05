var jt400 = require('jt400'),
  fs = require('fs'),
  exportSchema = require('../server/export-schema'),
  stream,
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
        db = jt400.configure(options);
        return db.query('SELECT * FROM SYSIBM.SYSDUMMY1').then(function(res) {
          console.log('connected!!');
          return true;
        });
      }
    },
    execute: function(sqlStatement) {
      var buffer = [],
        first = true,
        callback,
        metadatacb;

      //close previous stream
      if (stream) {
        stream.close();
        stream = undefined;
      }

      return {
        metadata: function(cb) {
          metadatacb = cb;
        },
        next: function(cb) {
          callback = cb;
          if (!stream && first) {
            // execute query
            try  {
              stream = db.executeAsStream({
                sql: sqlStatement,
                bufferSize: 130,
                metadata: true,
                objectMode: true
              });
            } catch (err) {
              cb(err);
              return;
            }

            stream.on('data', function(data) {
              if (first && metadatacb) {
                metadatacb(null, data);
              } else {
                buffer.push(data);
                if (buffer.length >= 131) {
                  callback(null, buffer.splice(0, 131), true);
                  stream.pause();
                }
              }
              first = false;
            });

            stream.on('end', function() {
              callback(null, buffer, false);
              stream = undefined;
            });

            stream.on('error', function(err) {
              callback(err);
            });
          } else if (stream) {
            stream.resume();
          }
        }
      };
    },
    exportSchemaToFile: function(opt) {
      var stream = exportSchema(db, opt);
      stream.pipe(fs.createWriteStream(opt.file));
      stream.on('end', function() {
        console.log('shema to file done');
      });
    }
  };



module.exports = connection;
