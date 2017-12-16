import { expect } from 'chai'
import { mkdir, writeFile } from 'fs'
import { join } from 'path'
import { nfcall } from 'q'
import * as rimraf from 'rimraf'
import { getSettings, ISettings } from '../settings'

const gandalfFolder = join(__dirname, '/.gandalf')

describe.only('get settings', () => {
    const fileName = join(__dirname, '/.gandalf/settings.json')

    afterEach(done => rimraf(gandalfFolder, () => done()))

    it('should create default settings', () => {
        return getSettings(__dirname).then(settings => {
            expect(settings.connections.length).to.equal(0)
        })
    })

    it('should return settings file', async () => {
        const settings: ISettings = {
            connections: [
                {
                    name: 'test',
                    host: 'foo',
                    user: 'bar',
                    editorFile: '',
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
        await nfcall(mkdir, gandalfFolder)
        await nfcall(writeFile, fileName, JSON.stringify(settings))
        const res = await getSettings(__dirname)
        expect(res.connections.length).to.equal(1)
    })
})
