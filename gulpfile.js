var gulp = require('gulp');
var args = require('yargs').argv;
var browserSync = require('browser-sync');
var config = require('./gulp.config')();
var del = require('del');
var $ = require('gulp-load-plugins')({ lazy: true });
var port = process.env.PORT || config.defaultPort;
var tasklist = require('gulp-task-listing');


//var jshint = require('gulp-jshint');
var jscs = require('gulp-jscs');
//var util = require('gulp-util');
//var gulpprint = require('gulp-print');
//var gulpif = require('gulp-if');

gulp.task('help', $.taskListing);
gulp.task('default', ['help']);


gulp.task('vet', function () { //check js files against jscs and jshint
    log('Analyzing source with JSCS and JSHint');
    return gulp
        .src(config.alljs)
        .pipe($.if(args.verbose, $.print()))
        .pipe($.jscs())
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish', { verbose: true })) //report out issues to CMD
        .pipe($.jshint.reporter('fail')); //die

});


gulp.task('styles', ['clean-styles'], function () { //dependency task of clean-styles
    log('Compiling LESS --> CSS');
    return gulp
        .src(config.less) //source of the files to put in plumbing
        .pipe($.plumber()) //handle error messages
        .pipe($.less()) //convert less to css
        .pipe($.autoprefixer({ browsers: ['last 2 version', '> 5%'] })) //vendor prefixes
        .pipe(gulp.dest(config.temp)); //output CSS to tmp folder

});

gulp.task('fonts', ['clean-fonts'], function () { //move fotns to build folder
    log('copying fonts to build folder');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

gulp.task('images', ['clean-images'], function () { //compress and move images to build folder
    log('compressing and moving images');

    return gulp
        .src(config.images) //todo
        .pipe($.imagemin({ optomizationLevel: 4 }))
        .pipe(gulp.dest(config.build + 'images'));
});
gulp.task('clean', function (done) {
    var delconfig = [].concat(config.build, config.temp);
    log('cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig);
});

gulp.task('clean-styles', function (done) { //empty the folder of previously build css
    clean(config.temp + '**/*.css', done); //call clean function, call back done function
});
gulp.task('clean-fonts', function (done) { //empty the folder of previously copied fonts
    clean(config.build +  'fonts/**/*.*', done); //call clean function, call back done function
});
gulp.task('clean-images', function (done) { //empty the folder of previous min/copied images
    var files = config.build + 'images/**/*.*';
    clean(files, done); //call clean function, call back done function
});

gulp.task('clean-code', function (done) { //empty the folder of previous min/copied images
    var files = [].concat(
        config.temp + '**/*.js',
        config.build + '**/*.html',
        config.build + 'js/**/*.js'
    );
    //log('cleaning ' + files);
    clean(files, done); //call clean function, call back done function
});




gulp.task('less-watcher', function () { //monitor changes to the less files, start the function 'styles' 
    gulp.watch([config.less], ['styles']);
});

gulp.task('templatecache', ['clean-code'], function () {
    log('create AngularJS $templatecache');

    return gulp
        .src(config.htmltemplates)
        .pipe($.minifyHtml({ empty: true }))
        .pipe($.angularTemplatecache(
            config.templateCache.file,
            config.templateCache.options
        )) 
        .pipe(gulp.dest(config.temp));
});

gulp.task('wiredep', function () {//gather css and app js, inject into html within comments
    log('Wire up the bower css js and app js into the index html');
    var options = config.getWiredepDefaultOptions();
    var wiredep = require('wiredep').stream;
    return gulp
        .src(config.index)
        .pipe(wiredep(options))
        .pipe($.inject(gulp.src(config.js)))
        .pipe(gulp.dest(config.client));
});
//combine styles, wiredep then inject app css into html
gulp.task('inject', ['wiredep', 'styles', 'templatecache'], function () { 
    log('Wire up the app css into index html');
    return gulp
        .src(config.index)
        .pipe($.inject(gulp.src(config.css)))
        .pipe(gulp.dest(config.client));
});


gulp.task('optimize', ['inject'], function () {
    log('optimizing the js, css, html');

    var assets = $.useref.assets({ searchPath: './' });
    var templateCache = config.temp + config.templateCache.file;

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe($.inject(gulp.src(templateCache, { read: false }), {
            starttag: '<!-- inject:templates:js -->'
        }))
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(gulp.dest(config.build));
});

gulp.task('serve-dev', ['inject'], function () {//start node server 
    var isDev = true;
    var nodeOptions = {
        script: config.nodeServer, //start ./src/server/app.js
        delayTime: 1,
        env: {
            'PORT': port, //default port 7203
            'NODE_ENV': isDev ? 'dev' : 'build' //this is dev for now
        },
        watch: [config.server] //watching files like app.js and others in /server folder

    };

    return $.nodemon(nodeOptions)
    .on('restart', ['vet'], function (ev) {
        log('nodemon restarted');
        log('files changed on restart: ' + ev);
        setTimeout(function () {
            browserSync.notify('reloading...');
            browserSync.reload({ stream: false });

        }, config.browserReloadDelay);
    })
    .on('start', function () {
        log('nodemon started');
        startBrowserSync();
    })
    .on('crash', function () {
        log('nodemon crashed: script crashed for some reason');
    })
    .on('exit', function () {
        log('nodemon exited cleanly');
    });

});


//////////
function startBrowserSync() { //watching for changes, restart if neccessary, inject if possible
    if (args.nosync || browserSync.active) {
        return;
    }
    log('starting browser-sync on port ' + port);

    gulp.watch([config.less], ['styles'])
        .on('change', function (event) {  changeEvent(event); });


    var options = { //proxy on port 3000 to sync across multiple browsers
        proxy: 'localhost:' + port,
        port: 3000,
        files: [//any changes in client directory
            config.client + '**/*.*',
            '!' + config.less,
            config.temp + '**/*.css'
        ], 
        ghostMode: { //multiple browsers running in sync
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true, //inject css without restarting server
        logFileChanges: true,
        logLevel: 'debug',
        logPrefix: 'gulp-patterns',
        notify: true,
        reloadDelay: 1000
    };

    browserSync(options);
}


function changeEvent(event) {
    var srcPattern = new RegExp('.*(?=' + config.source + ')');

    log('The File ' + event.path.replace(srcPattern, '') + ' ' + event.type);

}


function clean(path, done) {
    log('Cleaning' + $.util.colors.blue(path));
    del(path)
        .then(function () {//https://github.com/johnpapa/pluralsight-gulp/issues/24 promise
            done();
        });
}

function log(msg) { //handle logging  to the CMD of various types of messages
    if (typeof (msg) === 'object') {
        for (var item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}
