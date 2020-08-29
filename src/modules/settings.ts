import { ReadUserDataFile, WriteUserDataFile } from './userData'

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
        // {
        //     type: 'jt400',
        //     name: 'Inmemory database for test (no password needed)',
        //     host: 'hsql:inmemory',
        //     user: 'test',
        //     history: {
        //         file: 'test.history',
        //         max: 150,
        //         min: 100,
        //     },
        //     properties: {},
        //     theme: 'dark-blue',
        //     schemas: ['PUBLIC'],
        // },
    ],
}

const fileName = 'settings.json'
export const getSettings = (
    readUserDataFile: ReadUserDataFile,
    writeUserDataFile: WriteUserDataFile
): Promise<ISettings> => {
    return readUserDataFile(fileName)
        .catch(() => {
            const str = JSON.stringify(defaultSettings)
            return writeUserDataFile(fileName, str).then(() => str)
        })
        .then(JSON.parse)
}

export type SaveSettings = ReturnType<typeof createSaveSettings>
export const createSaveSettings = (writeUserDataFile: WriteUserDataFile) => (
    settings: ISettings
) => {
    writeUserDataFile(fileName, JSON.stringify(settings, null, 4)).catch(
        err => {
            console.log('error saving settings', err.message)
        }
    )
}
