
document.addEventListener("DOMContentLoaded", function() {
	'use strict';
	var editorElm = document.getElementById('editor');
	var myCodeMirror = new CodeMirror(editorElm, {
		value: 'SELECT * FROM ',
		mode: 'text/x-sql',
		lineNumbers: true,
		autofocus: true,
		theme: 'base16-dark'
	});
});