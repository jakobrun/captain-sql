'use strict';
var jt400 = require('jt400'),
    dnode = require('dnode'),
    server = dnode({
        connect: function(options, cb) {
            console.log('connecting...');
            jt400.configure(options);
            jt400.query('SELECT * FROM SYSIBM.SYSDUMMY1').then(function(res) {
                console.log('connected!!');
                cb(null, true);
            }, function(err) {
                cb(err);
            });
        },
        execute: function(sqlStatement, cb) {
            console.log(sqlStatement);
            jt400.executeQuery(sqlStatement).then(function(res) {
                cb(null, res);
            }, function(err) {
                cb(err);
            });
        }
    });

server.listen(5004);
