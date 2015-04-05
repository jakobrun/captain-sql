'use strict';
var q = require('q'),
  fs = require('fs');

var getDefaultSettings = function(baseDir) {
  return 'module.exports = {\n' +
    '  connections: [{\n' +
    "    name: 'My connection',\n" +
    "    host: 'myhost',\n" +
    "    user: '',\n" +
    "    editorFile: '" + baseDir + "/.gandalf/myhost.sql',\n" +
    '    properties: {},\n' +
    '    schema: [{\n' +
    "      name: 'lib1',\n" +
    "      file: '" + baseDir + "/.gandalf/schema.json'\n" +
    '    }]\n' +
    '  }]\n' +
    '};\n';
};

module.exports = function(baseDir) {
  var deffered = q.defer(),
    fileName = baseDir + '/.gandalf/settings.js';
  fs.readFile(fileName, function (e, data) {
    if(data) {
      deffered.resolve(require(fileName));
    } else {
      fs.mkdir(baseDir + '/.gandalf', function () {
        fs.writeFile(fileName, getDefaultSettings(), function (err) {
          if(err) {
            deffered.reject(err);
          } else {
            deffered.resolve(require(fileName));
          }
        });
      });
    }
  });
  return deffered.promise;
};
