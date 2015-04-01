/*global describe, it*/
'use strict';
var getTables = require('../js/modules/get_tables'),
  expect = require('chai').expect;

describe('get tables', function () {
  it('should return empty array when no tables ', function () {
    expect(getTables('')).to.eql([]);
  });

  [['select * from foo', [['foo']]],
    ['select * from foo f', [['foo', 'f']]],
    ['select * from foo as f', [['foo', 'f']]],
    ['select * from foo as f, bar b', [['foo', 'f'], ['bar', 'b']]],
    ['select * from foo as f join bar b on b.a = f.a', [['foo', 'f'], ['bar', 'b']]],
    ['select * from foo as f join bar b on b.a = f.a join baz on baza=b.c', [['foo', 'f'], ['bar', 'b'], ['baz']]],
    ['update foo set', [['foo']]],
    ['update foo f set', [['foo', 'f']]]
  ].map(function (example) {
    it('should return tables for query: ' + example[0], function () {
      expect(getTables(example[0])).to.eql(example[1]);
    });
  });
});