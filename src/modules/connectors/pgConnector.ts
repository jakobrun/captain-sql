import { createWriteStream } from 'fs'
import * as JSONStream from 'JSONStream'
import { Readable } from 'stream'
import { createGroupTablesTransform } from '../export-schema'
import { IConnectionInfo } from '../settings'
import { IClientConnection } from './types'

const { Client } = require('pg')

export const connect = async (
    options,
    settings: IConnectionInfo
): Promise<IClientConnection> => {
    const client = new Client({
        host: settings.host || 'localhost',
        port: options.port || 5432,
        user: settings.user,
        ssl: settings.ssl ? true : undefined,
        database: settings.database,
        password: options.password,
    })
    await client.connect()
    return {
        settings: () => settings,
        execute: async statement => {
            const result = await client.query({
                text: statement,
                rowMode: 'array',
            })
            return {
                isQuery: () => Boolean(result.fields.length),
                metadata: async () =>
                    result.fields.map(f => ({
                        precision:
                            f.dataTypeSize === -1 ? 1000 : f.dataTypeSize,
                        name: f.name,
                    })),
                updated: async () => result.rowCount,
                query: async () => {
                    return { data: result.rows }
                },
            }
        },
        isAutoCommit: () => true,
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
        close: () => {
            client.end()
        },
        exportSchemaToFile: ({ pubsub, file }: any) => {
            const sql = `SELECT c.TABLE_NAME, c.TABLE_SCHEMA, '' AS TABLE_TEXT, t.TABLE_TYPE, c.COLUMN_NAME, '' AS COLUMN_TEXT, c.DATA_TYPE, coalesce(c.NUMERIC_PRECISION, c.CHARACTER_MAXIMUM_LENGTH) LENGTH, c.NUMERIC_SCALE FROM information_schema.tables t
            join information_schema.columns c on t.table_schema=c.table_schema and t.table_name=c.table_name
            where t.table_schema='public'
            `
            const handleError = err => pubsub.emit('export-error', err)
            const stream = new Readable({ objectMode: true })
            stream._read = () => {
                // noop
            }
            client.query(
                {
                    text: sql,
                    rowMode: 'array',
                },
                (err, result) => {
                    if (err) {
                        handleError(err)
                    } else {
                        result.rows.map(row => stream.push(row))
                        stream.push(null)
                    }
                }
            )

            return stream
                .pipe(createGroupTablesTransform(pubsub))
                .on('error', handleError)
                .pipe(JSONStream.stringify())
                .on('error', handleError)
                .on('end', () => console.log('end json stringify'))
                .pipe(createWriteStream(file))
                .on('end', () => console.log('end write'))
                .on('error', handleError)
        },
    }
}
