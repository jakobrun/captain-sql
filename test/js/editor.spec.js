/*global CodeMirror, mocha, describe, it*/
mocha.setup('bdd');
var expect = require('chai').expect;
var events = require('events'),
  pubsub = new events.EventEmitter(),
  editor = gandalf.createEditor(m, pubsub, CodeMirror);

m.render(document.getElementById('editor_container'), editor.view());

describe('editor', function() {

  it('should set value', function() {
    editor.setValue('testing\nline2');
    expect(editor.getValue(' ')).to.equal('testing line2');
  });

  it('should get the selected statement', function() {
    editor.setValue('line1\nline2');
    editor.setCursor({line: 1, ch: 0});
    expect(editor.getCursorStatement(' ')).to.equal('line1 line2');
    editor.setValue('line1\n\nline2');
    editor.setCursor({line: 2, ch: 0});
    expect(editor.getCursorStatement(' ')).to.equal('line2');
    editor.setValue('line1\n\nline3\nline4\n\nline6 with stuff');
    editor.setCursor({line:3, ch: 0});
    expect(editor.getCursorStatement(' ')).to.equal('line3 line4');
  });
});
