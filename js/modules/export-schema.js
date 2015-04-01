'use strict';
var Transform = require('stream').Transform,
	JSONStream = require('JSONStream');

function exportSchema (db, opt) {
	var appendColumns = new Transform({objectMode: true});
	appendColumns._transform = function (chunk, encoding, done) {
		var that = this;
		db.getColumns({schema: opt.schema, table: chunk.table})
		.then(function (columns) {
			chunk.columns = columns;
			that.push(chunk);
			done();
		}).fail(function (err) {
			that.emit('error', err);
			done();
		});
	};
	return db.getTablesAsStream(opt)
		.pipe(appendColumns)
		.pipe(JSONStream.stringify());
}

module.exports = exportSchema;