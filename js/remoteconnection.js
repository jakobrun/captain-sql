'use strict';
var q = require('q'),
  JSONStream = require('JSONStream'),
  remote = require('net').connect(5004),
  connection = {
    connect: function(options) {
      console.log('connecting...');
      var deferred = q.defer(),
        jsonStream = JSONStream.parse();
      remote.write(JSON.stringify({
        command: 'connect',
        options: options
      }));

      remote.pipe(jsonStream);

      jsonStream.on('root', function(result) {
        console.log('connect result', result);
        remote.unpipe(jsonStream);
        deferred.resolve(result.connected);
      });

      jsonStream.on('error', function(err) {
        deferred.reject(err);
      });

      return deferred.promise;
    },
    executeAsStream: function(sqlStatement) {
      var jsonStream = JSONStream.parse([true]);
      remote.pipe(jsonStream);
      remote.write(JSON.stringify({
        command: 'execute',
        sql: sqlStatement
      }));

      jsonStream.on('root', function() {
        remote.unpipe(jsonStream);
        jsonStream.emit('end');
      });

      jsonStream.close = function() {
        remote.write(JSON.stringify({
          command: 'close'
        }));
      };

      return jsonStream;
    }
  };

module.exports = connection;
