import { mkdir, readFile, writeFile } from 'fs'

export interface ISchema {
    name: string
    file: string
}

export interface IHistorySettings {
    file: string
    max: number
    min: number
}

export interface IConnectionInfo {
    name: string
    host: string
    user: string
    editorFile: string
    image?: string
    theme?: string
    properties: {
        [key: string]: string
    }
    history: IHistorySettings
    schemas: ISchema[]
}

export interface ISettings {
    connections: IConnectionInfo[]
}

const defaultSettings: ISettings = {
    connections: [],
}

export function getSettings(baseDir = process.env.HOME): Promise<ISettings> {
    const fileName = baseDir + '/.gandalf/settings.json'
    return new Promise((resolve, reject) => {
        readFile(fileName, (_, data) => {
            if (data) {
                resolve(data)
            } else {
                mkdir(baseDir + '/.gandalf', () => {
                    const str = JSON.stringify(defaultSettings)
                    writeFile(fileName, str, writeErr => {
                        if (writeErr) {
                            reject(writeErr)
                        } else {
                            resolve(str)
                        }
                    })
                })
            }
        })
    }).then(JSON.parse)
}

export const saveSettings = (
    settings: ISettings,
    baseDir = process.env.HOME
) => {
    const fileName = baseDir + '/.gandalf/settings.json'
    writeFile(fileName, JSON.stringify(settings, null, 4), err => {
        if (err) {
            console.log('error saveing settings', err.message)
        }
    })
}