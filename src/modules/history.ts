import { ReadAppDataFile, WriteAppDataFile } from './appData'
import { IHistorySettings } from './settings'

export const createGetHistoryModel = (
    readAppDataFile: ReadAppDataFile,
    writeAppDataFile: WriteAppDataFile
) => async (options: IHistorySettings) => {
    let buffer: any[] = []
    let promise = Promise.resolve()
    const history = {
        push(item) {
            promise = promise.then(() => {
                buffer.splice(0, 0, item)
                if (buffer.length > options.max) {
                    buffer = buffer.slice(0, options.min)
                }
                return writeAppDataFile(
                    options.file,
                    buffer.map(obj => JSON.stringify(obj)).join(',')
                )
            })
            return promise
        },
        list: () => buffer,
    }
    try {
        const content = await readAppDataFile(options.file)
        buffer = JSON.parse('[' + content + ']')
    } catch (err) {
        // ignore error
    }
    return history
}
