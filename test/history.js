'use strict';
import createHistory from '../js/modules/history';
import {expect} from 'chai';
import {unlinkSync} from 'fs';

describe('history', function() {
  const options = {
      min: 2,
      max: 5,
      file: 'unittest.history'
    };
  let history;

  beforeEach(function(done) {
    createHistory(options).then((res) => {
      history = res;
    }).then(done, done);
  });

  afterEach(function () {
    unlinkSync(process.env.HOME + '/.gandalf/' + options.file);
  });

  it('should push to history up to max', function(done) {
    history.push('a').then(function () {
      expect(history.list()).to.eql(['a']);
      history.push('b');
      history.push('c');
      history.push('d');
      return history.push('e');
    }).then(function () {
      expect(history.list()).to.eql(['e', 'd', 'c', 'b', 'a']);
    }).then(done, done);
  });

  it('should slice down to min when max is reached', function(done) {
    history.push('a');
    history.push('b');
    history.push('c');
    history.push('d');
    history.push('e');
    history.push('f').then(function () {
      expect(history.list()).to.eql(['f', 'e']);
    }).then(done, done);
  });

  it('should persist in file', function(done) {
    history.push('a')
    .then(() => createHistory(options))
    .then(function (h2) {
      expect(h2.list()).to.eql(['a']);
      h2.push('b');
      h2.push('c');
      h2.push('d');
      h2.push('e');
      return h2.push('f');
    })
    .then(() => createHistory(options))
    .then(function (h3) {
      expect(h3.list()).to.eql(['f', 'e']);
    })
    .then(done, done);
  });
});
