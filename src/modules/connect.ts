import { createWriteStream } from 'fs'
import * as JSONStream from 'JSONStream'
import { connect as connectToDb, Connection, useInMemoryDb } from 'node-jt400'
import { Readable } from 'stream'
import { exportSchema } from './export-schema'
import { createFakedata } from './fakedata'
import { IConnectionInfo } from './settings'

export interface IColumnMetadata {
    precision: number
    name: string
}

export interface IMoreBuffer {
    data: string[][]
    more?: () => Promise<IMoreBuffer>
}

export interface IStatement {
    isQuery: () => boolean
    metadata: () => Promise<IColumnMetadata[]>
    updated: () => Promise<number>
    query: () => Promise<IMoreBuffer>
}

export interface IClientConnection {
    settings: () => IConnectionInfo
    execute: (statement: string) => Promise<IStatement>
    isAutoCommit: () => boolean
    commit: () => Promise<void>
    rollback: () => Promise<void>
    close: () => void
    exportSchemaToFile: (options: any) => Readable
}

function connection(
    db: Connection,
    settings: IConnectionInfo
): IClientConnection {
    let transaction
    let commitTransaction
    let rollbackTransaction
    let statement
    const createTransaction = () => {
        db
            .transaction(t => {
                transaction = t
                return new Promise((resolve, reject) => {
                    commitTransaction = resolve
                    rollbackTransaction = reject
                })
            })
            .catch(err => {
                console.log('connection rolled back:', err)
            })
    }
    if (!settings.autoCommit) {
        createTransaction()
    }
    return {
        settings() {
            return settings
        },
        execute(sqlStatement) {
            const buffer: string[][] = []

            // close previous statement
            if (statement) {
                statement.close()
                statement = undefined
            }

            return (transaction || db).execute(sqlStatement).then(st => {
                statement = st
                const statmentWrap: IStatement = {
                    isQuery: st.isQuery,
                    metadata: st.metadata,
                    updated: st.updated,
                    query() {
                        return new Promise((resolve, reject) => {
                            let currentResolve = resolve
                            let currentReject = reject
                            const handleError = err => currentReject(err)
                            const stream = st
                                .asStream({
                                    bufferSize: 130,
                                })
                                .on('error', handleError)
                                .pipe(JSONStream.parse([true]))
                                .on('error', handleError)

                            stream.on('data', (data: string[]) => {
                                buffer.push(data)
                                if (buffer.length >= 131) {
                                    stream.pause()
                                    currentResolve({
                                        data: buffer.splice(0, 131),
                                        more() {
                                            stream.resume()
                                            return new Promise(
                                                (resolve2, reject2) => {
                                                    currentResolve = resolve2
                                                    currentReject = reject2
                                                }
                                            )
                                        },
                                    })
                                }
                            })

                            stream.on('end', () => {
                                statement = undefined
                                currentResolve({
                                    data: buffer,
                                })
                            })
                        })
                    },
                }
                return statmentWrap
            })
        },
        isAutoCommit: () => Boolean(transaction),
        commit: () => {
            if (commitTransaction) {
                commitTransaction()
                createTransaction()
            }

            return Promise.resolve()
        },
        rollback: () => {
            if (rollbackTransaction) {
                rollbackTransaction('rollback')
                createTransaction()
            }
            return Promise.resolve()
        },
        close() {
            const d = db as any
            d.close()
        },
        exportSchemaToFile(opt) {
            const stream = exportSchema(db, opt)
            stream
                .pipe(createWriteStream(opt.file))
                .on('error', err => opt.pubsub.emit('export-error', err))
            return stream
        },
    }
}

export function connect(options, settings) {
    console.log('connecting...')
    if (options.host === 'hsql:inmemory') {
        const db = useInMemoryDb()
        return createFakedata(db).then(
            () => {
                console.log('connected to inmemory hsql!!')
                return connection(db, settings)
            },
            () => {
                // ignore error
                return connection(db, settings)
            }
        )
    } else {
        options.prompt = 'false'
        return connectToDb(options).then(conn => {
            console.log('connected!!')
            return connection(conn, settings)
        })
    }
}
