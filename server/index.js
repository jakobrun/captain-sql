'use strict';
var jt400 = require('jt400'),
  net = require('net'),
  dnode = require('dnode');

net.createServer(function(con) {
  console.log('new connection');
  var d = dnode({

    connect: function(options, cb) {
      console.log('connecting...');
      jt400Instance = jt400.configure(options);
      jt400Instance.query('SELECT * FROM SYSIBM.SYSDUMMY1').then(function(res) {
        console.log('connected!!');
        cb(null, true);
      }, function(err) {
        console.log('error', err);
        cb(err);
      });
    },

    useInMemory: function(cb) {
      jt400Instance = jt400.useInMemoryDb();
      require('./fakedata')(jt400Instance).then(function() {
          cb(null, true);
        }, function (err) {
          console.log('error', err);
          cb(null, true);
        });
    },

    execute: function(sql, cb, metadatacb) {
      var buffer = [],
        first = true;

      callback = cb;
      console.log('execute', sql);

      //close previous stream.
      if (stream) {
        stream.close();
      }

      // execute query
      try  {
        stream = jt400Instance.executeAsStream({
          sql: sql,
          bufferSize: 230,
          metadata: true,
          objectMode: true
        });
      } catch (err) {
        cb(err);
        return;
      }

      //on data
      stream.on('data', function(data) {
        if (first && metadatacb) {
          console.log('metadata', data);
          metadatacb(null, data);
        } else {
          buffer.push(data);
          if (buffer.length >= 131) {
            console.log('callback but more data');
            callback(null, buffer.splice(0, 131), true);
            stream.pause();
          }
        }
        first = false;
      });

      //on end
      stream.on('end', function() {
        console.log('callback end', buffer);
        callback(null, buffer, false);
        stream = null;
      });

      //on error
      stream.on('error', function(err) {
        callback(err);
      });
    },

    next: function(cb) {
      if(!stream) {
        return;
      }
      console.log('resume');
      callback = cb;
      stream.resume();
    }
  }),
    callback,
    jt400Instance,
    stream;


  con.on('end', function() {
    console.log('connection ended');
  });

  con.pipe(d).pipe(con);
}).listen(5004, function() {
  console.log('listening on port 5004');
});
