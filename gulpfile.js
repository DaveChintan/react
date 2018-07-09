
let gulp = require('gulp')
let babel = require("gulp-babel");

gulp.task('default', function () {
    gulp.src(['src/components/**/*.js', 'src/components/**/*.jsx', 'dist/**/*.js'])
        .pipe(babel({
            //babelrc: false,
            //presets: ['env', 'react'],

        }))
        .pipe(gulp.dest('dist'))
});