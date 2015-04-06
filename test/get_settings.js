'use strict';
import getSettings from '../js/modules/get_settings';
import {mkdir, writeFile, readFile} from 'fs';
import rimraf from 'rimraf';
import {nfcall} from 'q';
import {join} from 'path';
import {expect} from 'chai';

const gandalfFolder = join(__dirname, '/.gandalf');

describe('get settings', function () {
  const fileName = join(__dirname, '/.gandalf/settings.js');

  afterEach(function (done) {
    rimraf(gandalfFolder, () => done());
  });

  it('should create default settings', function(done) {
    getSettings(__dirname, require).then(function (settings) {
      expect(settings.connections.length).to.equal(1);
      settings = require(fileName);
      expect(settings.connections.length).to.equal(1);
    }).then(done, done);
  });

  it('should return settings file', function(done) {
    const expectedContent = 'module.exports = {connections: []}';
    return nfcall(mkdir, gandalfFolder)
    .then(() => nfcall(writeFile, fileName, expectedContent))
    .then(() => getSettings(__dirname))
    .then(() => nfcall(readFile, fileName))
    .then((content) => {
      expect(content.toString()).to.equal(expectedContent);
    }).then(done, done);
  });
});
