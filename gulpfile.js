var gulp = require('gulp'),
  less = require('gulp-less'),
  jshint = require('gulp-jshint'),
  mocha = require('gulp-mocha'),
  exec = require('child_process').exec,
  testSrc = './test/**/*.js';

gulp.task('lint', function() {
  return gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('node-test', function () {
  return gulp.src(testSrc, {read: false})
    .pipe(mocha());
});

gulp.task('nw-test', function () {
  exec('nw ./nw-test');
});

gulp.task('less', function() {
  gulp.src('./less/main.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('dev', ['less', 'node-test'], function() {
  gulp.watch(['./less/**/*.less'], ['less']);
  gulp.watch(['./js/*.js', testSrc], ['node-test']);
});
