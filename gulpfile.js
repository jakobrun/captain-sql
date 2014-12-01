var gulp = require('gulp');
var less = require('gulp-less');
var path = require('path');

gulp.task('less', function () {
  gulp.src('./less/main.less')
    .pipe(less())
    .pipe(gulp.dest('./css'));
});

gulp.task('dev', function () {
	gulp.watch(['./less/**/*.less'], ['less']);
});
