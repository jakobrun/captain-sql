'use strict';
var q = require('q'),
  dnode = require('dnode'),
  dConnection,
  remote,
  currentStream,
  connection = {
    connect: function(options) {
      console.log('connecting...');
      var deferred = q.defer();
      dConnection = dnode.connect(5004);

      dConnection.on('remote', function(r) {
        var cb = function(err, res) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(res);
          }
        };
        console.log('got remote');
        remote = r;
        if (options.host === 'hsql:inmemory') {
          remote.useInMemory(cb);
        } else {
          remote.connect(options, cb);
        }
      });
      dConnection.on('error', function(err) {
        console.log('error', err);
      });
      return deferred.promise;
    },
    execute: function(sqlStatement) {
      var execuded = false,
        metadatacb;
      return {
        metadata: function(cb) {
          metadatacb = cb;
        },
        next: function(cb) {
          if (execuded) {
            remote.next(cb);
          } else {
            remote.execute(sqlStatement, cb, metadatacb);
            execuded = true;
          }
        },
        close: remote.close
      };
    }
  };

module.exports = connection;
