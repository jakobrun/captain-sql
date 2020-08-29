import { ReadUserDataFile, WriteUserDataFile } from './userData'
import { IHistorySettings } from './settings'

export const createGetHistoryModel = (
    readUserDataFile: ReadUserDataFile,
    writeUserDataFile: WriteUserDataFile
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
                return writeUserDataFile(
                    options.file,
                    buffer.map(obj => JSON.stringify(obj)).join(',')
                )
            })
            return promise
        },
        list: () => buffer,
    }
    try {
        const content = await readUserDataFile(options.file)
        buffer = JSON.parse('[' + content + ']')
    } catch (err) {
        // ignore error
    }
    return history
}
