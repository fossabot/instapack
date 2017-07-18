"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const gulp = require("gulp");
const gutil = require("gulp-util");
const sourcemaps = require("gulp-sourcemaps");
const plumber = require("gulp-plumber");
const PipeErrorHandler_1 = require("./PipeErrorHandler");
const through2 = require("through2");
const vinyl = require("vinyl");
const resolve = require("resolve");
const fs = require("fs-extra");
const browserify = require("browserify");
const tsify = require("tsify");
const watchify = require("watchify");
const Templatify_1 = require("./Templatify");
const gwatch = require("gulp-watch");
const To = require("./PipeTo");
const Server_1 = require("./Server");
class Compiler {
    constructor(settings, flags) {
        this.unfuckBrowserifySourcePaths = (sourcePath, file) => {
            let folder = this.settings.input + '/js/';
            if (sourcePath.startsWith('node_modules')) {
                return '../' + sourcePath;
            }
            else if (sourcePath.startsWith(folder)) {
                return sourcePath.substring(folder.length);
            }
            else {
                return sourcePath;
            }
        };
        this.unfuckPostCssSourcePath = (sourcePath, file) => {
            if (sourcePath === 'site.css') {
                return "__PostCSS/site.css";
            }
            return sourcePath;
        };
        this.settings = settings;
        this.productionMode = flags.productionMode;
        this.watchMode = flags.watchMode;
        if (flags.serverPort) {
            this.watchMode = true;
            this.server = new Server_1.Server(flags.serverPort);
        }
        this.chat();
        this.registerAllTasks();
    }
    chat() {
        if (this.server) {
            gutil.log(gutil.colors.yellow("Server"), "mode: Listening on", gutil.colors.cyan('http://localhost:' + this.server.port));
        }
        else {
            gutil.log('Using output folder', gutil.colors.cyan(this.settings.outputFolder));
        }
        if (this.productionMode) {
            gutil.log(gutil.colors.yellow("Production"), "mode: Outputs will be minified.", gutil.colors.red("This process will slow down your build."));
        }
        else {
            gutil.log(gutil.colors.yellow("Development"), "mode: Outputs are", gutil.colors.red("NOT minified"), "in exchange for compilation speed.");
            gutil.log("Do not forget to minify before pushing to repository or production environment!");
        }
        if (this.watchMode) {
            gutil.log(gutil.colors.yellow("Watch"), "mode: Source codes will be automatically compiled on changes.");
        }
        else {
            gutil.log("Use", gutil.colors.yellow("--watch"), "flag for switching to", gutil.colors.yellow("Watch"), "mode for automatic compilation on source changes.");
        }
    }
    registerAllTasks() {
        gulp.task('all', ['concat', 'js', 'css']);
        this.registerConcatTask();
        this.registerJsTask();
        this.registerCssTask();
    }
    build(taskName) {
        gulp.start(taskName);
    }
    registerJsTask() {
        let jsEntry = this.settings.jsEntry;
        if (!fs.existsSync(jsEntry)) {
            gutil.log('JS entry', gutil.colors.cyan(jsEntry), 'was not found.', gutil.colors.red('Aborting JS build.'));
            gulp.task('js', () => { });
            return;
        }
        let browserifyOptions = {
            debug: true
        };
        if (this.watchMode) {
            browserifyOptions.cache = {};
            browserifyOptions.packageCache = {};
        }
        let bundler = browserify(browserifyOptions).transform(Templatify_1.Templatify).add(jsEntry).plugin(tsify);
        let compileJs = () => {
            gutil.log('Compiling JS', gutil.colors.cyan(jsEntry));
            return bundler.bundle().on('error', PipeErrorHandler_1.PipeErrorHandler)
                .pipe(To.Vinyl('bundle.js'))
                .pipe(To.VinylBuffer())
                .pipe(plumber({ errorHandler: PipeErrorHandler_1.PipeErrorHandler }))
                .pipe(sourcemaps.init({ loadMaps: true }))
                .pipe(To.MinifyProductionJs(this.productionMode))
                .pipe(sourcemaps.mapSources(this.unfuckBrowserifySourcePaths))
                .pipe(sourcemaps.write('./'))
                .pipe(To.BuildLog('JS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
        };
        if (this.watchMode) {
            bundler.plugin(watchify);
            bundler.on('update', compileJs);
        }
        gulp.task('js', compileJs);
    }
    registerCssTask() {
        let npm = this.settings.npmFolder;
        let cssEntry = this.settings.cssEntry;
        let sassGlob = this.settings.cssWatchGlob;
        let projectFolder = this.settings.root;
        if (!fs.existsSync(cssEntry)) {
            gutil.log('CSS entry', gutil.colors.cyan(cssEntry), 'was not found.', gutil.colors.red('Aborting CSS build.'));
            gulp.task('css', () => { });
            return;
        }
        gulp.task('css:compile', () => {
            gutil.log('Compiling CSS', gutil.colors.cyan(cssEntry));
            let sassImports = [this.settings.npmFolder];
            return gulp.src(cssEntry)
                .pipe(plumber({ errorHandler: PipeErrorHandler_1.PipeErrorHandler }))
                .pipe(sourcemaps.init())
                .pipe(To.Sass(sassImports))
                .pipe(To.CssProcessors(this.productionMode))
                .pipe(sourcemaps.mapSources(this.unfuckPostCssSourcePath))
                .pipe(sourcemaps.write('./'))
                .pipe(To.BuildLog('CSS compilation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputCssFolder));
        });
        let watchCallback = undefined;
        if (this.watchMode) {
            watchCallback = () => {
                return gwatch(sassGlob, () => {
                    gulp.start('css:compile');
                });
            };
        }
        gulp.task('css', ['css:compile'], watchCallback);
    }
    needPackageRestore() {
        let hasNodeModules = fs.existsSync(this.settings.npmFolder);
        let hasPackageJson = fs.existsSync(this.settings.packageJson);
        let restore = hasPackageJson && !hasNodeModules;
        if (restore) {
            gutil.log(gutil.colors.cyan('node_modules'), 'folder not found. Performing automatic package restore...');
        }
        return restore;
    }
    resolveAsPromise(path) {
        return new Promise((ok, reject) => {
            resolve(path, {
                basedir: this.settings.root
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    ok(result);
                }
            });
        });
    }
    resolveThenConcatenate(paths) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let concat = '';
            for (let path of paths) {
                let absolute = yield this.resolveAsPromise(path);
                concat += (yield fs.readFile(absolute, 'utf8')) + '\n';
            }
            return concat;
        });
    }
    registerConcatTask() {
        let concatCount = this.settings.concatCount;
        gutil.log('Resolving', gutil.colors.cyan(concatCount.toString()), 'concatenation targets...');
        if (concatCount === 0) {
            gulp.task('concat', undefined);
            return;
        }
        if (this.watchMode) {
            gutil.log("Concatenation task will be run once and", gutil.colors.red("NOT watched!"));
        }
        gulp.task('concat', () => {
            let g = through2.obj();
            let resolution = this.settings.concat;
            for (let target in resolution) {
                this.resolveThenConcatenate(resolution[target]).then(result => {
                    g.push(new vinyl({
                        path: target + '.js',
                        contents: Buffer.from(result)
                    }));
                    concatCount--;
                    if (concatCount === 0) {
                        g.push(null);
                    }
                });
            }
            return g.pipe(To.MinifyProductionJs(this.productionMode))
                .pipe(To.BuildLog('JS concatenation'))
                .pipe(this.server ? this.server.Update() : gulp.dest(this.settings.outputJsFolder));
        });
    }
}
exports.Compiler = Compiler;
