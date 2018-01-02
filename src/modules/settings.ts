import { remote } from 'electron'
import { readFile, writeFile } from 'fs'

export interface IHistorySettings {
    file: string
    max: number
    min: number
}

export type ConnectionType = 'jt400' | 'postgres' | undefined

export interface IConnectionInfo {
    type: ConnectionType
    name: string
    host: string
    database?: string
    ssl?: boolean
    bookmarksFile?: string
    user: string
    image?: string
    theme?: string
    autoCommit?: boolean
    properties: {
        [key: string]: string
    }
    history: IHistorySettings
    schemas: string[]
}

export interface ISettings {
    connections: IConnectionInfo[]
}

const defaultSettings: ISettings = {
    connections: [
        {
            type: 'jt400',
            name: 'Inmemory database for test (no password needed)',
            host: 'hsql:inmemory',
            user: 'test',
            history: {
                file: 'test.history',
                max: 150,
                min: 100,
            },
            properties: {},
            theme: 'dark-blue',
            schemas: ['PUBLIC'],
        },
    ],
}

export function getSettings(
    baseDir = remote.app.getPath('userData')
): Promise<ISettings> {
    const fileName = baseDir + '/settings.json'
    return new Promise((resolve, reject) => {
        readFile(fileName, (_, data) => {
            if (data) {
                resolve(data)
            } else {
                const str = JSON.stringify(defaultSettings)
                writeFile(fileName, str, writeErr => {
                    if (writeErr) {
                        reject(writeErr)
                    } else {
                        resolve(str)
                    }
                })
            }
        })
    }).then(JSON.parse)
}

export const saveSettings = (
    settings: ISettings,
    baseDir = remote.app.getPath('userData')
) => {
    const fileName = baseDir + '/settings.json'
    writeFile(fileName, JSON.stringify(settings, null, 4), err => {
        if (err) {
            console.log('error saving settings', err.message)
        }
    })
}
