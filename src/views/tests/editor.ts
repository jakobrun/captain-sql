import { expect } from 'chai'
import * as CodeMirror from 'codemirror'
import { EventEmitter } from 'events'
import * as fs from 'fs'
import * as m from 'mithril'
import { getTables } from '../../modules/get_tables'
import { createColumnsPrompt } from '../columns_prompt'
import { createEditor } from '../editor'
import { createPopupmenu } from '../popupmenu'

require('codemirror/addon/hint/show-hint.js')
require('codemirror/addon/search/searchcursor.js')
require('codemirror/addon/dialog/dialog.js')
require('codemirror/keymap/sublime.js')
require('codemirror/mode/sql/sql.js')
require('../../modules/sql-hint')

const pubsub = new EventEmitter()
const editor = createEditor(m, pubsub, CodeMirror, fs)

const editorContainer = document.createElement('div')
document.body.appendChild(editorContainer)
m.render(editorContainer, editor.view())

describe('editor', () => {
    it('should set value', () => {
        editor.setValue('testing\nline2')
        expect(editor.getValue(' ')).to.equal('testing line2')
    })

    it('should get the selected statement', () => {
        editor.setValue('line1\nline2')
        editor.setCursor({
            line: 1,
            ch: 0,
        })
        expect(editor.getCursorStatement(' ')).to.equal('line1 line2')
        editor.setValue('line1\n\nline2')
        editor.setCursor({
            line: 2,
            ch: 0,
        })
        expect(editor.getCursorStatement(' ')).to.equal('line2')
        editor.setValue('line1\n\nline3\nline4\n\nline6 with stuff')
        editor.setCursor({
            line: 3,
            ch: 0,
        })
        expect(editor.getCursorStatement(' ')).to.equal('line3 line4')
    })

    it('should select columns', () => {
        editor.setValue('select a, b\nfrom foo')
        editor.selectColumns()
        expect(editor.getSelection()).to.equal('a, b')
    })

    it('should select columns in selected statement', () => {
        editor.setValue('select * from bar\n\nselect a, b from foo')
        editor.setCursor({
            line: 2,
            ch: 10,
        })
        editor.selectColumns()
        expect(editor.getSelection()).to.equal('a, b')
    })

    it('should select columns in multible lines', () => {
        editor.setValue('select a, b,\nc from foo')
        editor.selectColumns()
        expect(editor.getSelection()).to.equal('a, b,\nc')
    })

    it('should select columns in multible lines no matter where the cursor is', () => {
        editor.setValue('select a, b,\nc from foo')
        editor.setCursor({ line: 1, ch: 0 })
        editor.selectColumns()
        expect(editor.getSelection()).to.equal('a, b,\nc')
    })

    it('should select columns with subqueries', () => {
        const columns = 'a, b, (select c from bar where d=a)'
        editor.setValue('select ' + columns + ' from foo')
        editor.selectColumns()
        expect(editor.getSelection()).to.equal(columns)
    })
})

describe.only('get text position', () => {
    const examples = [
        [
            'select * from foo',
            'FOO in *LIBL type *FILE not found.',
            { line: 0, start: 14, end: 17 },
        ],
        [
            'select * from foo f\nwhere bar=1 and f.baz=2',
            'Column or global variable BAR not found.',
            {
                line: 1,
                start: 6,
                end: 9,
            },
        ],
        [
            'select * from foo f\nwhere f.bar=1 and f.baz=2',
            '[SQL0205] Column BAR not in table GRSI02P in WTMDTA.',
            {
                line: 1,
                start: 7,
                end: 11,
            },
        ],
        [
            'select * from foo bar baz',
            '[SQL0104] Token BAZ was not valid. Valid tokens: FOR USE SKIP WAIT WITH FETCH LIMIT ORDER UNION EXCEPT OFFSET.',
            { line: 0, start: 22, end: 25 },
        ],
        [
            'select * from foo bar baz',
            'nomatch',
            { line: -1, start: -1, end: -1 },
        ],
    ]
    examples.map(([sql, message, res]) => {
        it(`should get text position for sql: ${sql}, message: ${
            message
        }`, () => {
            editor.setValue(sql)
            const pos = editor.getTextPos(message)
            expect(pos).to.eql(res)
        })
    })
})

describe('columns prompt', () => {
    it('should check current columns', () => {
        const prompt = createColumnsPrompt(
            m,
            editor,
            getTables,
            pubsub,
            createPopupmenu
        )
        const tables = {
            FOO: {
                columns: [{ name: 'a' }, { name: 'b' }],
            },
        }
        pubsub.emit('schema-loaded', tables)
        editor.setValue('select a from foo')
        pubsub.emit('columns-select')
        const list = prompt.controller.getList()
        expect(list.length).to.equal(2)
        expect(list[0].name).to.equal('a')
        expect(list[0].checked).to.equal(true)
        expect(list[1].name).to.equal('b')
        expect(list[1].checked).to.equal(false)
    })

    it('should check current columns and contain columns not found in any table', () => {
        const prompt = createColumnsPrompt(
            m,
            editor,
            getTables,
            pubsub,
            createPopupmenu
        )
        const tables = {
            FOO: {
                columns: [{ name: 'a' }, { name: 'b' }],
            },
        }
        pubsub.emit('schema-loaded', tables)
        editor.setValue('select a, foo(b) from foo')
        pubsub.emit('columns-select')
        const list = prompt.controller.getList()
        expect(list.length).to.equal(3)
        expect(list[0].checked).to.equal(true)
        expect(list[1].name).to.equal('foo(b)')
        expect(list[1].checked).to.equal(true)
        expect(list[2].checked).to.equal(false)
    })
})
