import { expect } from 'chai'
import { mkdir, readFile, writeFile } from 'fs'
import { join } from 'path'
import { nfcall } from 'q'
import * as rimraf from 'rimraf'
import { getSettings } from '../get_settings'

const gandalfFolder = join(__dirname, '/.gandalf')

describe('get settings', () => {
    const fileName = join(__dirname, '/.gandalf/settings.js')

    afterEach(done => rimraf(gandalfFolder, () => done()))

    it('should create default settings', () => {
        return getSettings(__dirname).then(settings => {
            expect(settings.connections.length).to.equal(1)
            settings = require(fileName)
            expect(settings.connections.length).to.equal(1)
        })
    })

    it('should return settings file', () => {
        const expectedContent = 'module.exports = {connections: []}'
        return nfcall(mkdir, gandalfFolder)
            .then(() => nfcall(writeFile, fileName, expectedContent))
            .then(() => getSettings(__dirname))
            .then(() => nfcall(readFile, fileName))
            .then(content => {
                expect(content.toString()).to.equal(expectedContent)
            })
    })
})
