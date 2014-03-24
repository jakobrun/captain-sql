'use strict';
var endpoint = require('./endpoint'),
  net = require('net'),
  dnode = require('dnode');

net.createServer(function(con) {
  console.log('new connection');
  var d = dnode(endpoint());

  con.on('end', function() {
    console.log('connection ended');
  });

  con.pipe(d).pipe(con);
}).listen(5004, function() {
  console.log('listening on port 5004');
});
