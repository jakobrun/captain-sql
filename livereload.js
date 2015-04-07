'use strict';
(function() {
  var gulp = require('gulp'),
    gui = require('nw.gui');

  gulp.task('js', function() {
    if (window.location) {
      console.log('reload location');
      gui.App.clearCache();
      gui.Window.get().reloadIgnoringCache();
    }
  });

  gulp.task('css', function() {
    var styleElm = document.getElementById('main_css');
    var restyled = styleElm.getAttribute('href') + '?v=' + Math.random(0, 10000);
    console.log('reload css:', restyled);
    styleElm.setAttribute('href', restyled);
  });

  gulp.watch(['./css/main.css'], ['css']);
  gulp.watch(['**/*.js'], ['js']);
}());
