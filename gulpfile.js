'use strict';
const gulp = require('gulp'),
  electron = require('electron-connect').server.create(),
  less = require('gulp-less');

gulp.task('less', function() {
  gulp.src('./less/main.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('serve', function () {

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('app.js', electron.restart);

  // Reload renderer process
  gulp.watch(['./dist/**/*.js', 'index.html'], electron.reload);
});