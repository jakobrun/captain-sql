var gulp = require('gulp'),
  less = require('gulp-less'),
  jshint = require('gulp-jshint');

gulp.task('lint', function() {
  return gulp.src('./js/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('less', function() {
  gulp.src('./less/main.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('dev', ['less'], function() {
  gulp.watch(['./less/**/*.less'], ['less']);
});
