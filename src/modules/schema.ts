import { remote } from 'electron'
import { join } from 'path'

export const createSchemaHandler = ({ readFile }, pubsub) => {
    const baseDir = remote.app.getPath('userData')
    let connection
    const loadSchema = () => {
        const tables: any[] = []
        connection
            .settings()
            .schemas.reduce(
                (promise, schema) =>
                    promise.then(
                        () =>
                            new Promise(resolve => {
                                readFile(
                                    join(
                                        baseDir,
                                        `${
                                            connection.settings().host
                                        }.${schema}.json`
                                    ),
                                    (err, schemaContent) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            try {
                                                const data: any[] = JSON.parse(
                                                    schemaContent
                                                )
                                                tables.push(...data)
                                            } catch (err) {
                                                console.log(
                                                    'schema parse error',
                                                    err
                                                )
                                            }
                                        }
                                        resolve()
                                    }
                                )
                            })
                    ),
                Promise.resolve()
            )
            .then(() => {
                pubsub.emit(
                    'schema-loaded',
                    tables.reduce((obj, table) => {
                        obj[table.table.toUpperCase()] = table
                        return obj
                    }, {})
                )
            })
            .catch(err => {
                console.log('load schema error', err)
            })
    }

    const exportSchema = () => {
        const settings = connection.settings()
        pubsub.emit('export-schema-start')
        settings.schemas
            .reduce(
                (promise, schema) =>
                    promise.then(
                        () =>
                            new Promise((resolve, reject) => {
                                connection
                                    .exportSchemaToFile({
                                        schema,
                                        file: join(
                                            baseDir,
                                            `${settings.host}.${schema}.json`
                                        ),
                                        pubsub,
                                    })
                                    .on('close', resolve)
                                    .on('error', reject)
                            })
                    ),
                Promise.resolve()
            )
            .then(() => {
                localStorage.setItem('schemaLastExported', String(Date.now()))
                loadSchema()
                pubsub.emit('export-schema-end')
            })
    }

    pubsub.on('schema-export', exportSchema)

    pubsub.on('connected', c => {
        connection = c
        const schemaLastExported = localStorage.getItem('schemaLastExported')
        if (!schemaLastExported) {
            exportSchema()
        } else {
            loadSchema()
        }
    })
}
