import { expect } from 'chai'
import { getSettings, ISettings, createSaveSettings } from '../settings'
import { createAppDataMock } from './userDataMock'

describe('get settings', () => {
    it('should create default settings', async () => {
        const { readUserDataFile, writeUserDataFile } = createAppDataMock()
        const settings = await getSettings(readUserDataFile, writeUserDataFile)
        expect(settings.connections.length).to.equal(0)
    })

    it('should save settings', async () => {
        const settings: ISettings = {
            connections: [
                {
                    type: 'jt400',
                    name: 'test',
                    host: 'foo',
                    user: 'bar',
                    properties: {},
                    history: {
                        file: 'history',
                        max: 200,
                        min: 190,
                    },
                    schemas: [],
                },
            ],
        }
        const { readUserDataFile, writeUserDataFile } = createAppDataMock()
        const saveSettings = createSaveSettings(writeUserDataFile)
        await saveSettings(settings)
        const res = await getSettings(readUserDataFile, writeUserDataFile)
        expect(res).to.deep.equal(settings)
    })
})
