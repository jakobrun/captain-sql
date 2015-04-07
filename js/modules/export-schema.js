'use strict';
import {Transform} from 'stream';
import JSONStream from 'JSONStream';

function exportSchema (db, opt) {
	const appendColumns = new Transform({objectMode: true});
	appendColumns._transform = function (chunk, encoding, done) {
		const that = this;
		db.getColumns({schema: opt.schema, table: chunk.table})
		.then(function (columns) {
			chunk.columns = columns;
			that.push(chunk);
		}).fail(function (err) {
			that.emit('error', err);
		}).finally(done);
	};
	return db.getTablesAsStream(opt)
		.pipe(appendColumns)
		.pipe(JSONStream.stringify());
}

export default exportSchema;
