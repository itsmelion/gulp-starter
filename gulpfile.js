const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const del = require('del');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const cache = require('gulp-cache');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');
const imageMin = require('gulp-imagemin');
const sass = require('gulp-sass');
const maps = require('gulp-sourcemaps');
const runsequence = require('run-sequence');
const size = require('gulp-size');
const gzip = require('gulp-gzip');
const rev = require('gulp-rev');
const newer = require('gulp-newer');
const argv = require('yargs').argv;
const reload = browserSync.reload;

var dev = true;
const source = './src';
const dist = './build';

const vendors = [
  // "./node_modules/moment/min/moment.min.js",
  // "./node_modules/gsap/TweenLite.js",
  "./node_modules/photoswipe/dist/photoswipe.js",
  "./node_modules/photoswipe/dist/photoswipe-ui-default.js",
  source + '/vendors/*.js'
];

gulp.task('coreStyles', () => {
  return gulp.src(source + '/styles/main.scss')
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 3
    }).on('error', sass.logError))
    .pipe(postcss([mqpacker(), autoprefixer(), cssnano({
      safe: true,
      autoprefixer: false
    })]))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('asyncStyles', () => {
  return gulp.src(source + '/styles/async.scss')
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 3
    }).on('error', sass.logError))
    .pipe(postcss([mqpacker(), autoprefixer(), cssnano({
      safe: true,
      autoprefixer: false
    })]))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('scripts', () => {
  return gulp.src(source + '/scripts/app/**/*.js')
    .pipe(concat('app.js'))
    .pipe(babel({
      "presets": ["es2017"]
    }))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('vendors', () => {
  return gulp.src(vendors)
    .pipe(concat('vendors.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('lazy', () => {
  return gulp.src(['./node_modules/pace-js/pace.min.js', source + '/scripts/lazy/*.js'])
    .pipe(concat('lazy.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('html', () => {
  return gulp.src(source + '/**/*.html')
    .pipe(htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: false,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    }))
    .pipe(gulp.dest(dist));
});

gulp.task('images', () => {
  return gulp.src(source + '/images/**/*')
    .pipe(newer(dist + '/images'))
    .pipe(imageMin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 6,
      svgoPlugins: [{
        removeViewBox: true
      }]
    }))
    .pipe(gulp.dest(dist + '/images'));
});

gulp.task('fonts', () => {
  return gulp.src(source + '/fonts/**/*')
    .pipe(newer(dist + '/fonts'))
    .pipe(gulp.dest(dist + '/fonts'));
});

gulp.task('serve', () => {
  runsequence('build', () => {
    browserSync.init({
      server: {
        baseDir: [source, dist],
        routes: {
          '/node_modules': 'node_modules'
        }
      },
      notify: false,
      open: false,
      port: 9000
    });

    gulp.watch([
      dist + '/fonts/**/*',
      dist + '/images/**/*',
      './app',
      './resources'
    ]).on('change', reload);

    gulp.watch(source + '/styles/**/*.scss', ['coreStyles', 'asyncStyles']);
    gulp.watch(source + '/scripts/app/**/*.js', ['scripts']);
    gulp.watch(source + '/scripts/lazy/**/*.js', ['lazy']);
  });
});


gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: true,
    port: 9000,
    server: {
      baseDir: dist
    }
  });
});

gulp.task('gzip', () => {
  return gulp.src([dist + '/*.js', dist + '/*.css'])
    .pipe(gzip())
    .pipe(gulp.dest(dist));
});

gulp.task('build', () => {
  runsequence(['vendors', 'scripts', 'coreStyles', 'asyncStyles', 'html', 'images', 'fonts'], 'gzip')
});

gulp.task('default', () => {
  new Promise(resolve => {
    dev = false;
    runSequence('build', resolve);
  });
});