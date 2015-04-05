'use strict';
var gulp = require('gulp'),
  less = require('gulp-less');

gulp.task('less', function() {
  gulp.src('./less/main.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('dev', ['less'], function() {
  gulp.watch(['./less/**/*.less'], ['less']);
});
