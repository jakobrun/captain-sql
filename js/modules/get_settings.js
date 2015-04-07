'use strict';
import {defer} from 'q';
import {readFile, mkdir, writeFile} from 'fs';

const getDefaultSettings = function() {
  return `
module.exports = {
  connections: [{
    name: 'My connection',
    host: 'myhost',
    user: '',
    editorFile: myhost.sql',
    history: {
      file: 'myhost.history',
      max: 300,
      min: 100
    },
    properties: {},
    schema: [{
      name: 'lib1',
      file: schema.json'
    }]
  }]
};
    `;
};

function getSettings(baseDir) {
  const {resolve, reject, promise} = defer();
  const fileName = baseDir + '/.gandalf/settings.js';
  readFile(fileName, function (e, data) {
    if(data) {
      resolve(require(fileName));
    } else {
      mkdir(baseDir + '/.gandalf', function () {
        writeFile(fileName, getDefaultSettings(), function (err) {
          if(err) {
            reject(err);
          } else {
            resolve(require(fileName));
          }
        });
      });
    }
  });
  return promise;
}

export default getSettings;
