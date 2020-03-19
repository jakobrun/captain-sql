import { EventEmitter } from 'events'
import * as JSONStream from 'JSONStream'
import { Connection } from 'node-jt400'
import { Readable, Transform } from 'stream'

export interface IExportSchemaOptions {
    pubsub: EventEmitter
    schema: string
}

const hsqlQuery = `SELECT c.TABLE_NAME, c.TABLE_SCHEMA, '' AS TABLE_TEXT, t.TABLE_TYPE, c.COLUMN_NAME, '' AS COLUMN_TEXT, c.DTD_IDENTIFIER, coalesce(c.NUMERIC_PRECISION, c.CHARACTER_MAXIMUM_LENGTH) LENGTH, c.NUMERIC_SCALE
FROM   INFORMATION_SCHEMA.COLUMNS c
join INFORMATION_SCHEMA.TABLES t on c.TABLE_NAME=t.TABLE_NAME and c.TABLE_SCHEMA=t.TABLE_SCHEMA
where c.table_schema=?
order by c.TABLE_NAME, c.ORDINAL_POSITION

`

const db2Query = `select c.TABLE_NAME, c.TABLE_SCHEMA, t.TABLE_TEXT, t.TABLE_TYPE, c.COLUMN_NAME, c.COLUMN_TEXT, c.DATA_TYPE, LENGTH, c.NUMERIC_SCALE
from QSYS2.SYSCOLUMNS c
join QSYS2.SYSTABLES t on t.TABLE_SCHEMA=c.TABLE_SCHEMA and t.TABLE_NAME=c.TABLE_NAME
where c.TABLE_SCHEMA=? and t.TABLE_TYPE in('T','P', 'V')
order by c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION
`

const getTableType = (type: string): string => {
    switch (type) {
        case 'BASE TABLE':
            return 'T'
        case 'VIEW':
            return 'V'
        default:
            return type
    }
}
export interface IFlusableTransform extends Transform {
    _flush: (done: () => void) => void
}

export const createGroupTablesTransform = (pubsub: EventEmitter) => {
    let currentTable
    const groupTables = new Transform({
        objectMode: true,
    }) as IFlusableTransform
    groupTables._transform = (chunk, _, next) => {
        const [
            table,
            tableSchema,
            tableRemarks,
            tableType,
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
                type: getTableType(tableType),
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
    groupTables._flush = done => {
        if (currentTable) {
            groupTables.push(currentTable)
            pubsub.emit('export-table', currentTable)
        }
        done()
    }
    return groupTables
}

export function exportSchema(
    db: Connection,
    { schema, pubsub }: IExportSchemaOptions
): Readable {
    const groupTables = createGroupTablesTransform(pubsub)
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
