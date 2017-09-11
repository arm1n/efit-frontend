/* jshint node: true */

'use strict';

/* =========================
 * GULPFILE
 * ========================= */

//
// PACKAGES
//
var gulp = require('gulp');

var gif = require('gulp-if');
var rev = require('gulp-rev');
var sass = require('gulp-sass');
var clean = require('gulp-clean');
var lazypipe = require('lazypipe');
var rename = require('gulp-rename');
var useref = require('gulp-useref');
var jshint = require('gulp-jshint');
var uglify = require('gulp-uglify');
var header  = require('gulp-header');
var htmlmin = require('gulp-htmlmin');
var cssnano = require('gulp-cssnano');
var imagemin = require('gulp-imagemin');
var browserSync = require('browser-sync');
var githubPages = require('gulp-gh-pages');
var sourcemaps = require('gulp-sourcemaps');
var revReplace = require('gulp-rev-replace');
var autoprefixer = require('gulp-autoprefixer');

var ngConfig = require('gulp-ng-config');
var ngTemplateCache = require('gulp-angular-templatecache');

//
// CONFIG
//
var ng = {
  app: 'eFit',
  views: 'eFit.views',
  config: 'eFit.config',
};

var paths = {
  src: 'src/',
  dist: 'dist/',

  js: 'js/',
  css: 'css/',
  img: 'img/',
  maps: 'maps/',
  scss: 'scss/',
  views: 'views/',
  vendor: 'vendor/',

  templates: 'js/views.js'
};

var globs = {
  copy: [
    'src/*.*',
    'src/img/**',
    'src/json/**',
    'src/views/**',
    'src/fonts/**',
    'src/js/config.yml'
  ],

  js: [
    'src/js/**/*.js'
  ],

  lazyJs: [
    'src/vendor/html5-polyfills/EventSource.js',
    'src/vendor/custom-elements/custom-elements.min.js',
  ],

  scss: [
    'src/scss/*.scss'
  ],

  scssWatch: [
    'src/scss/**/*.scss'
  ],

  scssInclude: [
    'src/vendor/uikit/src/scss',
    'src/vendor/chartist/dist/scss'
  ],

  css: [
    'src/css/*.css'
  ],

  img: [
    'src/img/**/*.png'
  ],

  views: [
    'src/views/**/*.html'
  ],

  config: [
    'src/config.yml'
  ],

  clean: [
    'dist/views',
    'dist/config.yml',
    'dist/**/*.{js,css}',
    '!dist/**/*.min.{js,css}'
  ],

  deploy: [
    'dist/**/*',
    './CNAME'
  ]
};

var settings = {
  autoPrefixer: 'last 4 version',
  htmlmin: {
    minifyJS: true,
    minifyCSS: true,
    removeComments: true,
    collapseWhitespace: true,
    removeEmptyAttributes: true,
    removeAttributeQuotes: true,
    collapseBooleanAttributes: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true
  },
  ngTemplate: {
    module: ng.views,
    standalone: true,
    moduleSystem: 'IIFE',
    base: function(file) {
      // drop away abs path segment
      var path = file.relative;

      // assert that it starts with /views
      // @see: globs.views -> don't contain
      path = !path.startsWith(paths.views) ?
        paths.views + path :
        path;

      return path;
    }
  },
  ngConfig: {
    createModule: true,
    parser: 'yml',
    wrap: true
  }
};

//
// BANNER
//
var banner = [
  '/*!\n' +
  ' * <%= package.name %>\n' +
  ' * <%= package.title %>\n' +
  ' * <%= package.url %>\n' +
  ' * @author <%= package.author %>\n' +
  ' * @version <%= package.version %>\n' +
  ' * Copyright ' + new Date().getFullYear() + '. <%= package.license %> licensed.\n' +
  ' */',
  '\n'
].join('');

//
// TASK: CLEAN
//
gulp.task('clean', function() {
  return gulp
    .src(paths.dist)
    .pipe(clean());
});

// TASK: COPY
gulp.task('copy', ['clean'], function() {
  return gulp
    .src(globs.copy, { base:paths.src })
    .pipe(gif(
      /views\/.+\.html$/,
      ngTemplateCache(
        // will be used by useref
        // and be thrown away if
        // we have replaced file
        // with revisioned output
        paths.templates,
        settings.ngTemplate
      )
    ))
    .pipe(gif(
      /config\.yml$/,
      ngConfig(
        ng.config,
        Object.assign(
          {
            environment: ['prod','all']
          },
          settings.ngConfig
        )
      )
    ))
    .pipe(gif(
      /\.(png|gif|jpg|svg)$/,
      imagemin()
    ))
    .pipe(gif(
      /config\.js$/,
      gulp.dest(paths.dist + paths.js),
      gulp.dest(paths.dist)
    ));
});

//
// TASK: LAZY
//
gulp.task('lazy', ['copy'], function(){

  var minifyJS = lazypipe()
    .pipe(uglify)
    .pipe(rename, { suffix: '.min'});

  return gulp.src(globs.lazyJs)
    .pipe(gif('!*.min.js', minifyJS()))
    .pipe(gulp.dest(paths.dist + paths.js));
});

//
// TASK: USEREF
//
gulp.task('useref', ['lazy'], function () {

  var minifyJS = lazypipe()
    .pipe(jshint, '.jshintrc')
    .pipe(jshint.reporter, 'default')
    .pipe(header, banner, { package : package })
    .pipe(uglify);

  var minifyCSS = lazypipe()
    .pipe(header, banner, { package : package })
    .pipe(cssnano);

  var minifyHTML = lazypipe()
    .pipe(htmlmin, settings.htmlmin);

  var startRev = lazypipe()
    .pipe(sourcemaps.init)
    .pipe(rev);

  var closeRev = lazypipe()
    .pipe(revReplace)
    .pipe(sourcemaps.write, paths.maps);

  return gulp.src(paths.src + 'index.html')
    .pipe(useref())
    .pipe(gif('*.html', minifyHTML(), startRev()))
    .pipe(gif('*.js', minifyJS()))
    .pipe(gif('*.css', minifyCSS()))
    .pipe(closeRev())
    .pipe(gulp.dest(paths.dist));

});

//
// TASK: SCSS
//
gulp.task('scss', function () {
  return gulp.src(globs.scss)
    .pipe(sass({
      includePaths: globs.scssInclude
    })
    .on('error', sass.logError))
    .pipe(autoprefixer(settings.autoPrefixer))
    .pipe(gulp.dest(paths.src + paths.css))
    .pipe(browserSync.reload({stream:true}));
});

//
// TASK: CONFIG
//
gulp.task('config', function() {
  gulp.src(paths.src + 'config.yml')
    .pipe(ngConfig(
      ng.config,
      Object.assign(
        {
          environment: ['dev','all']
        },
        settings.ngConfig
      )
    ))
    .pipe(gulp.dest(paths.src + paths.js));
});

//
// TASK: VIEWS
//
gulp.task('views', function() {
  gulp.src(globs.views)
    .pipe(ngTemplateCache(
      paths.templates,
      settings.ngTemplate
    ))
    .pipe(gulp.dest(paths.src));
});

//
// TASK: SYNC
//
gulp.task('sync', function() {
  browserSync.init(null, {
    server: {
        baseDir: 'src'
    },
    // important: having this enabled
    // would cause multiple events in
    // app (f.e. using ng-click)!!!!!
    ghostMode: false,
    // open: false,
  });
});

//
// TASK: RELOAD
//
gulp.task('reload', function () {
  browserSync.reload();
});

//
// TASK: WATCH
//
gulp.task('watch', function(){
  gulp.watch(globs.views, ['views', 'reload']);
  gulp.watch(globs.config, ['config', 'reload']);
  gulp.watch(globs.scssWatch, ['scss', 'reload']);
});

//
// TASK: BUILD
//
gulp.task('build', ['useref'], function() {
  return gulp.src(globs.clean)
    .pipe(clean());
});

//
// TASK: DEPLOY
//
gulp.task('deploy', ['build'], function() {
  return gulp.src(globs.deploy)
    .pipe(githubPages());
});

//
// TASK: DEFAULT
//
gulp.task('default', ['config', 'views', 'sync', 'watch']);
