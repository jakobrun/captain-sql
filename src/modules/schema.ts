export const createSchemaHandler = ({ readFile }, pubsub) => {
    const baseDir = process.env.HOME + '/.gandalf/'
    let connection
    const loadSchema = () => {
        connection.settings().schema.forEach(schema => {
            const t = Date.now()
            readFile(baseDir + schema.file, (err, schemaContent) => {
                console.log('Load schema:', Date.now() - t)
                if (err) {
                    console.log(err)
                } else {
                    pubsub.emit(
                        'schema-loaded',
                        JSON.parse(schemaContent).reduce((obj, table) => {
                            obj[table.table] = table
                            return obj
                        }, {})
                    )
                }
            })
        })
    }

    pubsub.on('schema-export', () => {
        const settings = connection.settings()
        connection
            .exportSchemaToFile({
                schema: settings.schema[0].name,
                file: baseDir + settings.schema[0].file,
            })
            .on('end', loadSchema)
    })

    pubsub.on('connected', c => {
        connection = c
        loadSchema()
    })
}
