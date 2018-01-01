import { createWriteStream } from 'fs'
import * as JSONStream from 'JSONStream'
import { Client } from 'pg'
import * as Cursor from 'pg-cursor'
import { Readable } from 'stream'
import { createGroupTablesTransform } from '../export-schema'
import { IConnectionInfo } from '../settings'
import { IClientConnection, IMoreBuffer } from './types'

const bufferSize = 100
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
            const cursor: any = await client.query(
                new Cursor(statement, null, {
                    rowMode: 'array',
                })
            )
            const readNext = () =>
                new Promise((resolve, reject) => {
                    cursor.read(bufferSize, (err, _, res) => {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(res)
                        }
                    })
                })
            const createQueryFun = res => async (): Promise<IMoreBuffer> => {
                return {
                    data: res.rows,
                    more:
                        res.rows.length === bufferSize
                            ? async () => createQueryFun(await readNext())()
                            : undefined,
                }
            }
            const result: any = await readNext()
            return {
                isQuery: () => Boolean(result.fields.length),
                metadata: async () =>
                    result.fields.map(f => ({
                        precision:
                            f.dataTypeSize === -1 ? 1000 : f.dataTypeSize,
                        name: f.name,
                    })),
                updated: async () => result.rowCount,
                query: createQueryFun(result),
            }
        },
        isAutoCommit: () => true,
        commit: () => Promise.resolve(),
        rollback: () => Promise.resolve(),
        close: () => {
            client.end()
        },
        exportSchemaToFile: ({ pubsub, file, schema }: any) => {
            const sql = `SELECT c.TABLE_NAME, c.TABLE_SCHEMA, '' AS TABLE_TEXT, t.TABLE_TYPE, c.COLUMN_NAME, coalesce(pgd.description, '') AS COLUMN_TEXT, c.DATA_TYPE, coalesce(c.NUMERIC_PRECISION, c.CHARACTER_MAXIMUM_LENGTH) LENGTH, c.NUMERIC_SCALE 
            FROM information_schema.tables t
            join information_schema.columns c on t.table_schema=c.table_schema and t.table_name=c.table_name
            join pg_catalog.pg_statio_all_tables pt on pt.schemaname=t.table_schema and pt.relname=t.table_name
            left outer join pg_catalog.pg_description pgd on pgd.objoid=pt.relid and pgd.objsubid=c.ordinal_position
            where t.table_schema=$1
            order by c.TABLE_NAME, c.ORDINAL_POSITION
            `
            const handleError = err => pubsub.emit('export-error', err)
            const stream = new Readable({ objectMode: true })
            stream._read = () => {
                // noop
            }
            client.query(
                {
                    text: sql,
                    values: [schema],
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
