'use strict';
var getSettings = require('../js/modules/get_settings'),
  fs = require('fs'),
  rimraf = require('rimraf'),
  q = require('q'),
  path = require('path'),
  expect = require('chai').expect;

var gandalfFolder = path.join(__dirname, '/.gandalf');

describe('get settings', function () {
  var fileName = path.join(__dirname, '/.gandalf/settings.js');

  afterEach(function (done) {
    rimraf(gandalfFolder, function () {
      done();
    });
  });

  it('should create default settings', function(done) {
    getSettings(__dirname, require).then(function (settings) {
      expect(settings.connections.length).to.equal(1);
      settings = require(fileName);
      expect(settings.connections.length).to.equal(1);
    }).then(done, done);
  });

  it('should return settings file', function(done) {
    var expectedContent = 'module.exports = {connections: []}';
    return q.nfcall(fs.mkdir, gandalfFolder).then(function () {
      return q.nfcall(fs.writeFile, fileName, expectedContent);
    }).then(function () {
      return getSettings(__dirname);
    }).then(function () {
      return q.nfcall(fs.readFile, fileName);
    }).then(function (content) {
      expect(content.toString()).to.equal(expectedContent);
    }).then(done, done);
  });
});
