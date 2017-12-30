import { IConnectionInfo } from '../settings'
import { IClientConnection } from './types'
const { Client } = require('pg')

export const connect = async (
    options,
    settings: IConnectionInfo
): Promise<IClientConnection> => {
    const client = new Client({
        host: options.host || 'localhost',
        port: options.port || 5432,
        user: options.user,
        database: settings.schemas[0].name,
        password: options.password,
    })
    await client.connect()
    return {
        settings: () => settings,
        execute: async statement => {
            // const cursor = client.query(
            //     new Cursor(statement, null, { rowMode: 'array' })
            // )
            // const rows = await new Promise((resolve, reject) => {
            //     cursor.read(30, (err, _, result) => {
            //         if (err) {
            //             reject(err)
            //         } else {
            //             resolve(result)
            //         }
            //     })
            // })
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
        exportSchemaToFile: (_: any) => {
            throw new Error('not implemented')
        },
    }
}
