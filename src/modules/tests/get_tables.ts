import { expect } from 'chai'
import { getTables } from '../get_tables'

describe('get tables', () => {
    it('should return empty array when no tables ', () => {
        expect(getTables('')).to.eql([])
    })
    ;[
        ['select * from foo', [['foo']]],
        ['select * from foo f', [['foo', 'f']]],
        ['select * from foo as f', [['foo', 'f']]],
        [
            'select * from foo as f, bar b',
            [
                ['foo', 'f'],
                ['bar', 'b'],
            ],
        ],
        [
            'select * from foo as f join bar b on b.a = f.a',
            [
                ['foo', 'f'],
                ['bar', 'b'],
            ],
        ],
        [
            'select * from foo as f join bar b on b.a = f.a join baz on baza=b.c',
            [['foo', 'f'], ['bar', 'b'], ['baz']],
        ],
        ['update foo set', [['foo']]],
        ['update foo f set', [['foo', 'f']]],
    ].map(example => {
        it('should return tables for query: ' + example[0], () => {
            expect(getTables(example[0])).to.eql(example[1])
        })
    })
})
