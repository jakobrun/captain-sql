var gulp = require('gulp');

gulp.task('js', function() {
    if (window.location) {
        console.log('reload location');
        window.location.reload();
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
