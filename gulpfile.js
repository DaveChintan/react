
let gulp = require('gulp')
let babel = require("gulp-babel");

gulp.task('default', function () {
    gulp.src(['src/**/*.js'])
        .pipe(babel({
            babelrc: true
        }))
        .pipe(gulp.dest('dist'))
});