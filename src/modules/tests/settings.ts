import { expect } from 'chai'
import { mkdir, writeFile } from 'fs'
import { join } from 'path'
import { nfcall } from 'q'
import * as rimraf from 'rimraf'
import { getSettings, ISettings } from '../settings'

const userDataFolder = join(__dirname, '/userData')

describe('get settings', () => {
    const fileName = join(__dirname, '/userData/settings.json')

    beforeEach(done => {
        mkdir(userDataFolder, () => done())
    })

    afterEach(done => rimraf(userDataFolder, () => done()))

    it('should create default settings', async () => {
        const settings = await getSettings(userDataFolder)
        expect(settings.connections.length).to.equal(1)
    })

    it('should return settings file', async () => {
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
        await nfcall(writeFile, fileName, JSON.stringify(settings))
        const res = await getSettings(userDataFolder)
        expect(res.connections.length).to.equal(1)
    })
})
