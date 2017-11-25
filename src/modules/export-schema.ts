import * as JSONStream from 'JSONStream'
import { Transform } from 'stream'

export function exportSchema(db, opt) {
    const appendColumns = new Transform({ objectMode: true })
    appendColumns._transform = (chunk, _, done) => {
        const that = this
        db
            .getColumns({ schema: opt.schema, table: chunk.table })
            .then(columns => {
                chunk.columns = columns
                that.push(chunk)
            })
            .fail(err => {
                that.emit('error', err)
            })
            .finally(done)
    }
    return db
        .getTablesAsStream(opt)
        .pipe(appendColumns)
        .pipe(JSONStream.stringify())
}
