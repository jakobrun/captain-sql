import { expect } from 'chai'
import { search } from '../listSearch'

describe.only('list search', () => {
    const list = [
        {
            name: 'John',
            job: 'programmer',
        },
        {
            name: 'Lisa',
            job: 'programmer',
        },
        {
            name: 'Bruce',
            job: 'tester',
        },
    ]

    it('should return all values if search string is empty', () => {
        const valuesToSearch = item => [item.name]
        const res = search({
            searchValue: '',
            list,
            valuesToSearch,
            highlightOpen: '*',
            highlightClose: '*',
        })
        expect(res.length).to.equal(3)
        expect(res.map(i => i.highlighted)).to.deep.equal([
            ['John'],
            ['Lisa'],
            ['Bruce'],
        ])
    })

    it('should return highlighted list ex 1', () => {
        const valuesToSearch = item => [item.name]
        const res = search({
            searchValue: 'Jo',
            list,
            valuesToSearch,
            highlightOpen: '*',
            highlightClose: '*',
        })
        expect(res.length).to.equal(1)
        expect(res.map(i => i.highlighted)).to.deep.equal([['*Jo*hn']])
    })

    it('should return highlighted list ex 2', () => {
        const valuesToSearch = item => [item.name, item.job]
        const res = search({
            searchValue: 'o',
            list,
            valuesToSearch,
            highlightOpen: '*',
            highlightClose: '*',
        })
        expect(res.length).to.equal(2)
        expect(res.map(i => i.highlighted)).to.deep.equal([
            ['J*o*hn', 'pr*o*grammer'],
            ['Lisa', 'pr*o*grammer'],
        ])
    })
})
