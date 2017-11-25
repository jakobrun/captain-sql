import { mkdir, readFile, writeFile } from 'fs'
import { defer } from 'q'

const getDefaultSettings = () => {
    return `
module.exports = {
  connections: [{
    name: 'My connection',
    host: 'myhost',
    user: '',
    editorFile: 'myhost.sql',
    history: {
      file: 'myhost.history',
      max: 300,
      min: 100
    },
    properties: {},
    schema: [{
      name: 'lib1',
      file: 'schema.json'
    }]
  }]
};
    `
}

export function getSettings(baseDir) {
    const { resolve, reject, promise } = defer()
    const fileName = baseDir + '/.gandalf/settings.js'
    readFile(fileName, (_, data) => {
        if (data) {
            resolve(require(fileName))
        } else {
            mkdir(baseDir + '/.gandalf', () => {
                writeFile(fileName, getDefaultSettings(), err => {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(require(fileName))
                    }
                })
            })
        }
    })
    return promise
}
