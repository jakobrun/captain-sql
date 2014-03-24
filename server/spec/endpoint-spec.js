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
});