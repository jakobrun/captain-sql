import { expect } from 'chai'
import { createGetHistoryModel } from '../history'
import { WriteAppDataFile, ReadAppDataFile } from '../appData'

describe('history', () => {
    const options = {
        min: 2,
        max: 5,
        file: 'unittest.history',
    }
    const createAppData = () => {
        const index = {}
        const writeAppDataFile: WriteAppDataFile = async (
            fileName,
            content
        ) => {
            index[fileName] = content
        }
        const readAppDataFile: ReadAppDataFile = async fileName => {
            if (!index[fileName]) {
                throw new Error(`file not found: ${fileName}`)
            }
            return index[fileName]
        }
        return { writeAppDataFile, readAppDataFile }
    }
    const createMockedHistoryModel = () => {
        const { writeAppDataFile, readAppDataFile } = createAppData()
        return createGetHistoryModel(readAppDataFile, writeAppDataFile)(options)
    }

    it('should push to history up to max', async () => {
        const history = await createMockedHistoryModel()
        await history.push('a')
        expect(history.list()).to.eql(['a'])
        await history.push('b')
        await history.push('c')
        await history.push('d')
        await history.push('e')
        expect(history.list()).to.eql(['e', 'd', 'c', 'b', 'a'])
    })

    it('should slice down to min when max is reached', async () => {
        const history = await createMockedHistoryModel()
        await history.push('a')
        await history.push('b')
        await history.push('c')
        await history.push('d')
        await history.push('e')
        await history.push('f')
        expect(history.list()).to.eql(['f', 'e'])
    })

    it('should persist in file', async () => {
        const { writeAppDataFile, readAppDataFile } = createAppData()
        const history1 = await createGetHistoryModel(
            readAppDataFile,
            writeAppDataFile
        )(options)
        await history1.push('a')
        const history2 = await createGetHistoryModel(
            readAppDataFile,
            writeAppDataFile
        )(options)
        expect(history2.list()).to.eql(['a'])
        await history2.push('b')
        await history2.push('c')
        await history2.push('d')
        await history2.push('e')
        await history2.push('f')
        const history3 = await createGetHistoryModel(
            readAppDataFile,
            writeAppDataFile
        )(options)
        expect(history3.list()).to.eql(['f', 'e'])
    })
})
