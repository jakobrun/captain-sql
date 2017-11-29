import { createWriteStream } from 'fs'
import * as JSONStream from 'JSONStream'
import { connect as connectToDb, useInMemoryDb } from 'node-jt400'
import { exportSchema } from './export-schema'
import { createFakedata } from './fakedata'

function connection(db, settings) {
    let statement
    return {
        settings() {
            return settings
        },
        execute(sqlStatement) {
            const buffer: any[] = []

            // close previous statement
            if (statement) {
                statement.close()
                statement = undefined
            }

            return db.execute(sqlStatement).then(st => {
                statement = st
                return {
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

                            stream.on('data', data => {
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
            })
        },
        close() {
            db.close()
        },
        exportSchemaToFile(opt) {
            const stream = exportSchema(db, opt)
            stream.pipe(createWriteStream(opt.file))
            stream.on('end', () => console.log('schema to file done'))
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
