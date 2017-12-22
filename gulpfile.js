const project = "GulpStarter";
const source = './src';
const dist = './build';

const vendors = [
  "./node_modules/pace-js/pace.min.js",
  "./node_modules/jquery/dist/jquery.min.js",
  "./node_modules/moment/min/moment.min.js",
  // "./node_modules/gsap/TweenLite.js",
  // "./node_modules/photoswipe/dist/photoswipe.js",
  // "./node_modules/photoswipe/dist/photoswipe-ui-default.js",
  source + '/vendors/*.js'
];

const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const postcss = require('gulp-postcss');
const del = require('del');
const mqpacker = require('css-mqpacker');
const cssnano = require('cssnano');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const htmlmin = require('gulp-htmlmin');
const gulpif = require('gulp-if');
const imageMin = require('gulp-imagemin');
const sass = require('gulp-sass');
const sourcemaps = require('gulp-sourcemaps');
const runsequence = require('run-sequence');
const gzip = require('gulp-gzip');
const rev = require('gulp-rev');
const revReplace = require('gulp-rev-replace');
const useref = require('gulp-useref');
const newer = require('gulp-newer');
const argv = require('yargs').argv;
const reload = browserSync.reload;

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
    .pipe(gulpif(!argv.production, sourcemaps.init()))
    .pipe(babel({
      "presets": ["env"]
    }))
    .pipe(concat('app.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(!argv.production, sourcemaps.write()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('vendors', () => {
  return gulp.src(vendors)
    .pipe(gulpif(!argv.production, sourcemaps.init()))
    .pipe(concat('vendors.js'))
    .pipe(uglify())
    .pipe(gulpif(!argv.production, sourcemaps.write()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('async', () => {
  return gulp.src(source + '/scripts/async/*.js')
    .pipe(gulpif(!argv.production, sourcemaps.init()))
    .pipe(babel({
      "presets": ["env"]
    }))
    .pipe(concat('async.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(!argv.production, sourcemaps.write()))
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

gulp.task("rev", function () {
  return gulp.src([dist + "/**/*.css", dist + "/**/*.js", dist + "/**/*.gz"])
    .pipe(rev())
    .pipe(gulp.dest(dist))
    .pipe(rev.manifest())
    .pipe(gulp.dest(dist))
});
gulp.task("revision", ["rev"], function () {
  var manifest = gulp.src(dist + "/rev-manifest.json");

  return gulp.src(dist + "/index.html")
    .pipe(revReplace({
      manifest: manifest
    }))
    .pipe(gulp.dest(dist));
});

gulp.task('serve', ['build'], () => {
  // Files that requires build tasks
  gulp.watch(source + '/styles/**/*.scss', ['coreStyles', 'asyncStyles']);
  gulp.watch(source + '/scripts/app/**/*.js', ['scripts']);
  gulp.watch(source + '/scripts/async/**/*.js', ['async']);
  gulp.watch(source + '/**/*.html', ['html']);

  // Reload Files
  gulp.watch([
    dist + '/fonts/**/*',
    dist + '/images/**/*',
    dist + '/index.html',
    './app',
    './resources',
  ]).on('change', reload);

  browserSync.init({
    server: {
      baseDir: [dist],
      routes: {
        '/node_modules': 'node_modules'
      }
    },
    notify: true,
    open: false,
    port: 9000,
    logLevel: "info",
    logConnections: false,
    logPrefix: project
  });
});

gulp.task('serve:prod', () => {
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

gulp.task('delete', function () {
  return del([dist + '/**', '**/.sass-cache', '**/.DS_Store']).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
  });
});

gulp.task('build', () => {
  runsequence([
      //Scripts
      'vendors', 'scripts', 'async',
      //Styles
      'coreStyles', 'asyncStyles',
      'html',
      'fonts', 'images'
    ], // revision
    'gzip'
  )
});