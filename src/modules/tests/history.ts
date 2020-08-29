import { expect } from 'chai'
import { createGetHistoryModel } from '../history'
import { createAppDataMock } from './userDataMock'

describe('history', () => {
    const options = {
        min: 2,
        max: 5,
        file: 'unittest.history',
    }
    const createMockedHistoryModel = () => {
        const { writeUserDataFile, readUserDataFile } = createAppDataMock()
        return createGetHistoryModel(
            readUserDataFile,
            writeUserDataFile
        )(options)
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
        const { writeUserDataFile, readUserDataFile } = createAppDataMock()
        const history1 = await createGetHistoryModel(
            readUserDataFile,
            writeUserDataFile
        )(options)
        await history1.push('a')
        const history2 = await createGetHistoryModel(
            readUserDataFile,
            writeUserDataFile
        )(options)
        expect(history2.list()).to.eql(['a'])
        await history2.push('b')
        await history2.push('c')
        await history2.push('d')
        await history2.push('e')
        await history2.push('f')
        const history3 = await createGetHistoryModel(
            readUserDataFile,
            writeUserDataFile
        )(options)
        expect(history3.list()).to.eql(['f', 'e'])
    })
})
