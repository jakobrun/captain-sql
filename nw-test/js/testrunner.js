/*global mocha*/
(function() {
  'use strict';
  var gulp = require('gulp');

  gulp.task('js', function() {
    if (window.location) {
      console.log('reload location');
      window.location.reload();
    }
  });

  gulp.watch(['../**/*.js'], ['js']);

  mocha.checkLeaks();
  mocha.run();
}());
