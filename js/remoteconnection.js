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
        console.log('got remote');
        remote = r;
        remote.useInMemory(function(err, res) {
          if (err) {
            deferred.reject(err);
          } else {
            deferred.resolve(res);
          }
        });
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
            execuded = true;
          } else {
            remote.execute(sqlStatement, cb, metadatacb);
          }
        },
        close: remote.close
      };
    }
  };

module.exports = connection;
