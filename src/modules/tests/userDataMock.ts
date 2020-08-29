import { WriteUserDataFile, ReadUserDataFile } from '../userData'

export const createAppDataMock = () => {
    const index = {}
    const writeUserDataFile: WriteUserDataFile = async (fileName, content) => {
        index[fileName] = content
    }
    const readUserDataFile: ReadUserDataFile = async fileName => {
        if (!index[fileName]) {
            throw new Error(`file not found: ${fileName}`)
        }
        return index[fileName]
    }
    return { writeUserDataFile, readUserDataFile }
}
