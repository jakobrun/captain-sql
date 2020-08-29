import { ipcRenderer } from 'electron'

export type ReadUserDataFile = (fileName: string) => Promise<string>
export const readUserDataFile: ReadUserDataFile = fileName =>
    ipcRenderer.invoke('read-user-data-file', fileName)

export type WriteUserDataFile = (
    fileName: string,
    content: string
) => Promise<void>
export const writeUserDataFile: WriteUserDataFile = (fileName, content) =>
    ipcRenderer.invoke('write-user-data-file', fileName, content)
