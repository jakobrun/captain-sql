import { readFile, writeFile } from 'fs'
import * as q from 'q'

export function getHistoryModel(options) {
    let buffer: any[] = []
    let promise = q()
    const fileName = process.env.HOME + '/.gandalf/' + options.file
    const history = {
        push(item) {
            promise = promise.then(() => {
                buffer.splice(0, 0, item)
                if (buffer.length > options.max) {
                    buffer = buffer.slice(0, options.min)
                }
                return q.nfcall(
                    writeFile,
                    fileName,
                    buffer.map(obj => JSON.stringify(obj)).join(',')
                )
            })
            return promise
        },
        list: () => buffer,
    }
    return q.nfcall(readFile, fileName).then(content => {
        buffer = JSON.parse('[' + content + ']')
        return history
    }, () => history)
}
