import { remote } from 'electron'

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
                                    baseDir +
                                        '/' +
                                        connection.settings().host +
                                        '.' +
                                        schema +
                                        '.json',
                                    (err, schemaContent) => {
                                        if (err) {
                                            console.log(err)
                                        } else {
                                            try {
                                                const data: any[] = JSON.parse(
                                                    schemaContent
                                                )
                                                tables.push(...data)
                                                resolve()
                                            } catch (err) {
                                                console.log(
                                                    'schema parse error',
                                                    err
                                                )
                                            }
                                        }
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

    pubsub.on('schema-export', () => {
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
                                        file:
                                            baseDir +
                                            '/' +
                                            settings.host +
                                            '.' +
                                            schema +
                                            '.json',
                                        pubsub,
                                    })
                                    .on('close', resolve)
                                    .on('error', reject)
                            })
                    ),
                Promise.resolve()
            )
            .then(() => {
                loadSchema()
                pubsub.emit('export-schema-end')
            })
    })

    pubsub.on('connected', c => {
        connection = c
        loadSchema()
    })
}
