'use strict';
var q = require('q'),
  fs = require('fs');

module.exports = function(options) {
  var buffer = [],
    promise = q(),
    fileName = process.env.HOME + '/.gandalf/' + options.file,
    history = {
      push: function(item) {
        promise = promise.then(function() {
          buffer.splice(0, 0, item);
          if (buffer.length > options.max) {
            buffer = buffer.slice(0, options.min);
            return q.nfcall(fs.writeFile, fileName, buffer.map(JSON.stringify).join(','));
          } else {
            return q.nfcall(fs.appendFile, fileName, (buffer.length === 1 ? '' : ',') +
              JSON.stringify(item));
          }
        });
        return promise;
      },
      list: function() {
        return buffer;
      }
    };
  return q.nfcall(fs.readFile, fileName).then(function(content) {
    buffer = JSON.parse('[' + content + ']');
    return history;
  }, function() {
    return history;
  });
};
