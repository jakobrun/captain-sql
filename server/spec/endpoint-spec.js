/* global describe, it, beforeEach, expect */
'use strict';
var endpoint = require('../endpoint');

describe('endpoint', function () {
	var instance;
	beforeEach(function (done) {
		instance = endpoint();
		instance.useInMemory(function () {
			done();
		});
	});

	it('should execute query', function (done) {
		instance.execute('select * from person', function (err, result) {
			expect(err).toBeNull();
			expect(result.length).toBe(131);
			done();
		});
	});

	it('should execute query and return error when sql is incorrect', function (done) {
		instance.execute('slect * from person', function (err) {
			expect(err).not.toBeNull();
			done();
		});
	});

	it('should export schema', function (done) {
		var stream = instance.exportSchema({schema: 'PUBLIC'});
		var data = '';
		stream.on('data', function (d) {
			data += d;
		});
		stream.on('end', function () {
			var tables = JSON.parse(data);
			expect(tables.length).toBe(2);
			expect(tables[0].columns.length).toBe(5);
			done();
		});
		stream.on('error', function (err) {
			done(err);
		});
	});
});