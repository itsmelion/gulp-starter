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
const mainBowerFiles = require('main-bower-files');
const syncpkg = require('sync-pkg');
const wiredep = require('wiredep').stream;
const gzip = require('gulp-gzip');

const reload = browserSync.reload;

var dev = true;
const source = './src';
const dist = './dist';

gulp.task('coreStyles', () => {
  gulp.src(source + '/styles/main.scss')
    .pipe(gulpif(dev, maps.init()))
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 3
    }).on('error', sass.logError))
    .pipe(postcss([mqpacker(), autoprefixer(), cssnano({
      safe: true,
      autoprefixer: false
    })]))
    .pipe(gulpif(dev, maps.write(), gulp.dest(dist)))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('asyncStyles', () => {
  gulp.src(source + '/styles/async.scss')
    .pipe(gulpif(dev, maps.init()))
    .pipe(sass.sync({
      outputStyle: 'expanded',
      precision: 3
    }).on('error', sass.logError))
    .pipe(postcss([mqpacker(), autoprefixer(), cssnano({
      safe: true,
      autoprefixer: false
    })]))
    .pipe(gulpif(dev, maps.write(), gulp.dest(dist)))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('scripts', () => {
  gulp.src(source + '/scripts/**/*.js')
    .pipe(gulpif(dev, maps.init()))
    .pipe(babel())
    // .pipe(eslint({
    //   globals: [
    //     'jQuery',
    //     '$'
    //   ],
    //   envs: [
    //     'browser'
    //   ]
    // }))

    .pipe(gulpif(dev, maps.write()))
    .pipe(gulpif(!dev, uglify()))
    .pipe(gulp.dest(dist))
    .pipe(reload({
      stream: true
    }));
});

gulp.task('html', () => {
  gulp.src(source + '/**/*.html')
    .pipe(wiredep({

      dependencies: true, // default: true  
      includeSelf: true, // default: false 

      overrides: {
        // see `Bower Overrides` section below. 
        // 
        // This inline object offers another way to define your overrides if 
        // modifying your project's `bower.json` isn't an option. 
      },

      fileTypes: {
        // defaults: 
        html: {
          block: /(([ \t]*)<!--\s*bower:*(\S*)\s*-->)(\n|\r|.)*?(<!--\s*endbower\s*-->)/gi,
          detect: {
            js: /<script.*src=['"]([^'"]+)/gi,
            css: /<link.*href=['"]([^'"]+)/gi
          },
          replace: {
            js: '<script async src="{{filePath}}"></script>',
            css: '<link async href="{{filePath}}" />'
          }
        }

      }

    }))
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

// TODO: Sync bower.json with package.json
gulp.task('sync', () => {
  return syncpkg();
});

gulp.task('images', () => {
  gulp.src(source + '/images/**/*')
    .pipe(imageMin({
      interlaced: true,
      progressive: true,
      optimizationLevel: 5,
      svgoPlugins: [{
        removeViewBox: true
      }]
    }))
    .pipe(gulp.dest(dist + '/images'));
});

gulp.task('serve', () => {
  runsequence('build', () => {
    browserSync.init({
      notify: true,
      port: 9000,
      server: {
        baseDir: [source, dist],
        routes: {
          '/node_modules': 'node_modules'
        }
      }
    });

    gulp.watch([
      source + '/**/*.html',
      source + '/images/**/*',
    ]).on('change', reload);

    gulp.watch(source + '/styles/**/*.scss', ['coreStyles', 'asyncStyles']);
    gulp.watch(source + '/scripts/**/*.js', ['scripts']);
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
  gulp.src([dist + '/*.js', dist + './dist/*.css'])
    .pipe(gzip())
    .pipe(gulp.dest(dist));
});


gulp.task('build', () => {
  runsequence(['scripts', 'coreStyles', 'asyncStyles', 'html', 'images'], 'gzip')
});

gulp.task('default', () => {
  new Promise(resolve => {
    dev = false;
    runSequence('build', resolve);
  });
});