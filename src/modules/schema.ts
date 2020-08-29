import { ipcRenderer } from 'electron'
import { join } from 'path'
import { ReadUserDataFile } from './userData'

export const createSchemaHandler = (
    readUserDataFile: ReadUserDataFile,
    pubsub
) => {
    let connection
    const loadSchema = async () => {
        const index: any = {}
        const { schemas } = connection.settings()
        for (const schema of schemas) {
            const schemaContent = await readUserDataFile(
                `${connection.settings().host}.${schema}.json`
            ).catch(err => {
                console.log('error reading schema', err)
                return '[]'
            })

            try {
                const data: any[] = JSON.parse(schemaContent)
                data.forEach(table => {
                    index[table.table.toUpperCase()] = table
                })
            } catch (err) {
                console.log('schema parse error', err)
            }
        }
        pubsub.emit('schema-loaded', index)
    }

    const exportSchema = async () => {
        const baseDir = await ipcRenderer.invoke('get-user-data-path')
        const settings = connection.settings()
        pubsub.emit('export-schema-start')
        const { schemas } = connection.settings()
        for (const schema of schemas) {
            await new Promise((resolve, reject) => {
                connection
                    .exportSchemaToFile({
                        schema,
                        file: join(baseDir, `${settings.host}.${schema}.json`),
                        pubsub,
                    })
                    .on('close', resolve)
                    .on('error', reject)
            })
        }
        localStorage.setItem('schemaLastExported', String(Date.now()))
        loadSchema()
        pubsub.emit('export-schema-end')
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
