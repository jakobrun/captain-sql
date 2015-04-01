/*global CodeMirror, mocha*/
mocha.setup('bdd');
var expect = require('chai').expect,
  getTables = require('../js/modules/get_tables'),
  events = require('events'),
  pubsub = new events.EventEmitter(),
  editor = exports.createEditor(m, pubsub, CodeMirror);

m.render(document.getElementById('editor_container'), editor.view());

describe('editor', function() {

  it('should set value', function() {
    editor.setValue('testing\nline2');
    expect(editor.getValue(' ')).to.equal('testing line2');
  });

  it('should get the selected statement', function() {
    editor.setValue('line1\nline2');
    editor.setCursor({
      line: 1,
      ch: 0
    });
    expect(editor.getCursorStatement(' ')).to.equal('line1 line2');
    editor.setValue('line1\n\nline2');
    editor.setCursor({
      line: 2,
      ch: 0
    });
    expect(editor.getCursorStatement(' ')).to.equal('line2');
    editor.setValue('line1\n\nline3\nline4\n\nline6 with stuff');
    editor.setCursor({
      line: 3,
      ch: 0
    });
    expect(editor.getCursorStatement(' ')).to.equal('line3 line4');
  });

  it('should select columns', function() {
    editor.setValue('select a, b\nfrom foo');
    editor.selectColumns();
    expect(editor.getSelection()).to.equal('a, b');
  });

  it('should select columns in selected statement', function() {
    editor.setValue('select * from bar\n\nselect a, b from foo');
    editor.setCursor({
      line: 2,
      ch: 10
    });
    editor.selectColumns();
    expect(editor.getSelection()).to.equal('a, b');
  });

  it('should select columns in multible lines', function() {
    editor.setValue('select a, b,\nc from foo');
    editor.selectColumns();
    expect(editor.getSelection()).to.equal('a, b,\nc');
  });

  it('should select columns in multible lines no matter where the cursor is', function() {
    editor.setValue('select a, b,\nc from foo');
    editor.setCursor({line: 1, ch: 0});
    editor.selectColumns();
    expect(editor.getSelection()).to.equal('a, b,\nc');
  });

  it('should select columns with subqueries', function() {
    var columns = 'a, b, (select c from bar where d=a)';
    editor.setValue('select ' + columns + ' from foo');
    editor.selectColumns();
    expect(editor.getSelection()).to.equal(columns);
  });

});

describe('columns prompt', function () {
  it('should check current columns', function() {
    var prompt = exports.createColumnsPrompt(m, editor, getTables, pubsub, exports.createPopupmenu),
      tables = {
        'FOO': {
          columns: [{name: 'a'}, {name: 'b'}]
        }
      };
    pubsub.emit('schema-loaded', tables);
    editor.setValue('select a from foo');
    pubsub.emit('columns-select');
    var list = prompt.controller.getList();
    expect(list.length).to.equal(2);
    expect(list[0].name).to.equal('a');
    expect(list[0].checked).to.equal(true);
    expect(list[1].name).to.equal('b');
    expect(list[1].checked).to.equal(false);
  });

  it('should check current columns and contain columns not found in any table', function() {
    var prompt = exports.createColumnsPrompt(m, editor, getTables, pubsub, exports.createPopupmenu),
      tables = {
        'FOO': {
          columns: [{name: 'a'}, {name: 'b'}]
        }
      };
    pubsub.emit('schema-loaded', tables);
    editor.setValue('select a, foo(b) from foo');
    pubsub.emit('columns-select');
    var list = prompt.controller.getList();
    expect(list.length).to.equal(3);
    expect(list[0].checked).to.equal(true);
    expect(list[1].name).to.equal('foo(b)');
    expect(list[1].checked).to.equal(true);
    expect(list[2].checked).to.equal(false);
  });
});
