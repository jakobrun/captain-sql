import { expect } from 'chai'
import { unlinkSync } from 'fs'
import { getHistoryModel } from '../history'

describe('history', () => {
    const options = {
        min: 2,
        max: 5,
        file: 'unittest.history',
    }
    let history

    beforeEach(() =>
        getHistoryModel(options).then(res => {
            history = res
        })
    )

    afterEach(() => {
        unlinkSync(process.env.HOME + '/.gandalf/' + options.file)
    })

    it('should push to history up to max', () => {
        return history
            .push('a')
            .then(() => {
                expect(history.list()).to.eql(['a'])
                history.push('b')
                history.push('c')
                history.push('d')
                return history.push('e')
            })
            .then(() => {
                expect(history.list()).to.eql(['e', 'd', 'c', 'b', 'a'])
            })
    })

    it('should slice down to min when max is reached', () => {
        history.push('a')
        history.push('b')
        history.push('c')
        history.push('d')
        history.push('e')
        return history.push('f').then(() => {
            expect(history.list()).to.eql(['f', 'e'])
        })
    })

    it('should persist in file', () => {
        return history
            .push('a')
            .then(() => getHistoryModel(options))
            .then(h2 => {
                expect(h2.list()).to.eql(['a'])
                h2.push('b')
                h2.push('c')
                h2.push('d')
                h2.push('e')
                return h2.push('f')
            })
            .then(() => getHistoryModel(options))
            .then(h3 => {
                expect(h3.list()).to.eql(['f', 'e'])
            })
    })
})
