'use strict';
var dnode = require('dnode'),
    q = require('q'),
    remote,
    remoteConnect = function(deferred, options) {
        remote.connect(options, function(err, res) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                deferred.resolve(res);
            }
        });
    },
    connection = {
        connect: function(options) {
            console.log('connecting...');
            var deferred = q.defer();
            if (remote) {
                remoteConnect(deferred, options);
            } else {
                var d = dnode.connect(5004);
                d.on('remote', function(rem) {
                    remote = rem;
                    remoteConnect(deferred, options);
                });
            }
            return deferred.promise;
        },
        execute: function(sqlStatement) {
            return q.nfcall(remote.execute, sqlStatement);
        }
    };

module.exports = connection;
