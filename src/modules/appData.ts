import { ipcRenderer } from 'electron'

export type ReadAppDataFile = (fileName: string) => Promise<string>
export const readAppDataFile: ReadAppDataFile = fileName =>
    ipcRenderer.invoke('read-app-data-file', fileName)

export type WriteAppDataFile = (
    fileName: string,
    content: string
) => Promise<void>
export const writeAppDataFile: WriteAppDataFile = (fileName, content) =>
    ipcRenderer.invoke('write-app-data-file', fileName, content)
