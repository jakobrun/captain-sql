
document.addEventListener("DOMContentLoaded", function() {
	'use strict';
	var runQurey = function (editor) {
			alert(editor.getValue(' '));
		},
		cm = CodeMirror(document.getElementById('editor'), {
			value: 'SELECT * FROM ',
			mode: 'text/x-sql',
			lineNumbers: true,
			autofocus: true,
			theme: 'base16-dark',
			extraKeys: {
				'Ctrl-Enter': runQurey
			}
		});
});