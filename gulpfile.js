const project = "GulpStarter";
const source = './src';
const dist = './build';

const vendors = [
  // "./node_modules/moment/min/moment.min.js",
  // "./node_modules/gsap/TweenLite.js",
  "./node_modules/photoswipe/dist/photoswipe.js",
  "./node_modules/photoswipe/dist/photoswipe-ui-default.js",
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
    .pipe(gulpif(argv.production, sourcemaps.init()))
    .pipe(babel({
      "presets": ["env", {
        "targets": {
          "browsers": ["last 2 versions", "safari >= 7"]
        }
      }]
    }))
    .pipe(concat('app.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(argv.production, sourcemaps.write(dist)))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('vendors', () => {
  return gulp.src(vendors)
    .pipe(gulpif(argv.production, sourcemaps.init()))
    .pipe(concat('vendors.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(argv.production, sourcemaps.write(dist)))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('lazy', () => {
  return gulp.src(['./node_modules/pace-js/pace.min.js', source + '/scripts/lazy/*.js'])
    .pipe(gulpif(argv.production, sourcemaps.init()))
    .pipe(concat('lazy.js'))
    .pipe(gulpif(argv.production, uglify()))
    .pipe(gulpif(argv.production, sourcemaps.write(".")))
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

gulp.task("revision", function () {
  return gulp.src([dist + "/**/*.css", dist + "/**/*.js"])
    .pipe(rev())
    .pipe(gulp.dest(dist))
    .pipe(rev.manifest())
    .pipe(gulp.dest(dist))
});
gulp.task("revreplace", ["revision"], function () {
  var manifest = gulp.src(dist + "/rev-manifest.json");

  return gulp.src(opt.srcFolder + "/index.html")
    .pipe(revReplace({
      manifest: manifest
    }))
    .pipe(gulp.dest(dist));
});

gulp.task('serve', () => {
  runsequence('build', () => {
    // Files that requires build tasks
    gulp.watch(source + '/styles/**/*.scss', ['coreStyles', 'asyncStyles']);
    gulp.watch(source + '/scripts/app/**/*.js', ['scripts']);
    gulp.watch(source + '/scripts/lazy/**/*.js', ['lazy']);
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
        baseDir: [source, dist],
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

gulp.task('delete', function () {
  return del([dist + '/**', '**/.sass-cache', '**/.DS_Store']).then(paths => {
    console.log('Deleted files and folders:\n', paths.join('\n'));
  });
});

gulp.task('build', () => {
  runsequence([
    'delete',
    //Scripts
    'vendors', 'scripts', 'lazy',
    //Styles
    'coreStyles', 'asyncStyles',
    //other
    'fonts', 'images', 'html', 'gzip',
    // revision
    'revision', 'revreplace'
  ])
});