import { EventEmitter } from 'events'
import * as JSONStream from 'JSONStream'
import { Connection } from 'node-jt400'
import { Transform } from 'stream'

export interface IExportSchemaOptions {
    pubsub: EventEmitter
    schema: string
}

const hsqlQuery = `SELECT TABLE_NAME, TABLE_SCHEMA, '' AS TABLE_TEXT, COLUMN_NAME, '' AS COLUMN_TEXT, DTD_IDENTIFIER, coalesce(NUMERIC_PRECISION, CHARACTER_MAXIMUM_LENGTH) LENGTH, NUMERIC_SCALE
FROM   INFORMATION_SCHEMA.COLUMNS
where table_schema=?
order by TABLE_NAME, ORDINAL_POSITION
`

const db2Query = `select c.TABLE_NAME, c.TABLE_SCHEMA, t.TABLE_TEXT, c.COLUMN_NAME, c.COLUMN_TEXT, c.DATA_TYPE, LENGTH, c.NUMERIC_SCALE
from QSYS2.SYSCOLUMNS c
join QSYS2.SYSTABLES t on t.TABLE_SCHEMA=c.TABLE_SCHEMA and t.TABLE_NAME=c.TABLE_NAME
where c.TABLE_SCHEMA=? and t.TABLE_TYPE in('T','P')
order by c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
`

export function exportSchema(
    db: Connection,
    { schema, pubsub }: IExportSchemaOptions
) {
    let currentTable
    const groupTables = new Transform({ objectMode: true })
    groupTables._transform = (chunk, _, next) => {
        const [
            table,
            tableSchema,
            tableRemarks,
            columnName,
            columnRemarks,
            columnType,
            length,
            scale,
        ] = chunk
        if (!currentTable || currentTable.table !== table) {
            if (currentTable) {
                groupTables.push(currentTable)
                pubsub.emit('export-table', currentTable)
            }
            currentTable = {
                table,
                schema: tableSchema,
                remarks: tableRemarks,
                columns: [],
            }
        }
        currentTable.columns.push({
            type: columnType,
            name: columnName,
            remarks: columnRemarks,
            precision: Number(length),
            scale: Number(scale),
        })
        next()
    }
    const handleError = err => pubsub.emit('export-error', err)
    const sql = db.isInMemory() ? hsqlQuery : db2Query
    return db
        .createReadStream(sql, [schema])
        .on('error', handleError)
        .pipe(JSONStream.parse([true]))
        .on('error', handleError)
        .pipe(groupTables)
        .on('error', handleError)
        .pipe(JSONStream.stringify())
        .on('error', handleError)
}
