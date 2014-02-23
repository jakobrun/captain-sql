'use strict';
var jt400 = require('jt400'),
    JSONStream = require('JSONStream'),
    net = require('net');


function connect(con, options) {
    console.log('connecting...');
    jt400.configure(options);
    jt400.query('SELECT * FROM SYSIBM.SYSDUMMY1').then(function(res) {
        console.log('connected!!');
        con.write(JSON.stringify({connected: true}));
    }, function(err) {
        console.log('error', err);
        con.emit('error', err);
    });
    return jt400;
}

net.createServer(function (con) {
    var dbConnection,
        jdbcStream;
    console.log('connection started', con.localAddress, con.remoteAddress);

    con.pipe(JSONStream.parse()).on('data', function (data) {
        if(data.command === 'connect') {
            dbConnection = connect(con, data.options);
        } else if(data.command === 'execute') {
            console.log('execute', data.sql);
            if(jdbcStream) {
                jdbcStream.close();
            }
            jdbcStream = dbConnection.executeAsStream({sql: data.sql, metadata: true, objectMode: false});
            jdbcStream.pipe(con, {end: false});
        } else if(data.command === 'close' && jdbcStream) {
            jdbcStream.close();
        }
    });

    con.on('end', function () {
        console.log('connection ended');
    });
}).listen(5004);

