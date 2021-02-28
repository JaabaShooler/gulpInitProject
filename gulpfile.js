const { func } = require('assert-plus');
const { pipe } = require('rxjs');
const fs = require('fs');

const 
    projectFolder = 'result',
    sourceFolder = 'app';

let path = {
    build: {
        html: projectFolder + "/",
        css: projectFolder+"/css/",
        js: projectFolder+"/js/",
        img: projectFolder+"/img/",
        fonts: projectFolder+"/fonts/", 
    },
    src: {
        html: sourceFolder + "/*.html",
        css: sourceFolder+"/sass/main.sass",
        js: sourceFolder+"/js/script.js",
        img: sourceFolder+"/img/**/*.{jpg,jpeg,png,svg,gif,ico,webp}",
        fonts: sourceFolder+"/fonts/",
    },
    watch: {
        html: sourceFolder + "/**/*.html",
        css: sourceFolder+"/sass/**/*.sass",
        js: sourceFolder+"/js/**/*.js",
        img: sourceFolder+"/img/**/*.{jpg,png,svg,gif,ico,webp}",
    },
    clean: "./" + projectFolder + "/",
}

/*
_________________________________________________________________________________________________________________________________________
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
_________________________________________________________________________________________________________________________________________
*/


const 
    {src, dest} = require('gulp'),
    gulp = require('gulp'),
    browsersync = require('browser-sync').create(),
    del = require('del'),
    sass = require('gulp-sass'),
    autoprefixer = require('gulp-autoprefixer'),
    group_media = require('gulp-group-css-media-queries'),
    clean_css = require('gulp-clean-css'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglify-es').default,
    imgmin = require('gulp-imagemin'),
    webp = require('gulp-webp'),
    webpHTML = require('gulp-webp-html'),
    ttf2woff = require('gulp-ttf2woff'),
    ttf2woff2 = require('gulp-ttf2woff2'),
    fonter = require('gulp-fonter');

function fonts(){
    src(path.src.fonts)
    .pipe(ttf2woff())
    .pipe(dest(path.build.fonts))
    return src(path.src.fonts)
    .pipe(ttf2woff2())
    .pipe(dest(path.build.fonts))
}

function browserSync(){ // параметры сервера
    browsersync.init({
        server: {
            baseDir: "./" + projectFolder + "/"
        },
        port: 3000,
        notify: false
    });
}

function html(){ // обработка html файлов
    return src(path.src.html)
    .pipe(webpHTML())
    .pipe(dest(path.build.html))
    .pipe(browsersync.stream())
}


function img(){ // обработка картинок
    return src(path.src.img)
    .pipe(webp({
        quality: 70
    }))
    .pipe(dest(path.build.img))
    .pipe(src(path.src.img))
    .pipe(imgmin({
        progressive: true,
        svgoPlugins: [{removeViewBox: false}],
        interlaced: true,
        optimizationLevel: 3 // 0 .. 7
    }))
    .pipe(dest(path.build.img))
    .pipe(browsersync.stream())
}


function js(){ // обработка js файлов
    return src(path.src.js)
    .pipe(dest(path.build.js))
    .pipe(uglify())
    .pipe(rename({
        extname: '.min.js'
    }))
    .pipe(dest(path.build.js))
    .pipe(browsersync.stream())
}

function css(){  // оброботка sass файлов -> css
    return src(path.src.css)
    .pipe(sass(
        {
            outputStyle: 'expanded' // expanded - читаемый css | compressed - cжатый css 
        }))
    .pipe(group_media())
    .pipe(autoprefixer({
        overrideBrowserslist: ["last 5 versions"],
        cascade: true
    }))
    .pipe(dest(path.build.css))
    .pipe(clean_css())
    .pipe(rename({
        extname: '.min.css'
    }))
    .pipe(dest(path.build.css))
    .pipe(browsersync.stream())
}

function watchFiles(params){ // обработка файлов папки app
    gulp.watch([path.watch.html], html); // слежка за изминениями html файлов
    gulp.watch([path.watch.css], css); // слежка за изминениями css файлов
    gulp.watch([path.watch.js], js); // слежка за изминениями js файлов
    gulp.watch([path.watch.img], img); // слежка за изминениями картинок
}

function clean(params){ // удаление папки result
    return del(path.clean)
}

gulp.task('otf2ttf', function(){ // cmd -> gulp otf2ttf все файлы с разширением otf конвертируются в ttf
    return gulp.src([sourceFolder + '/fonts/*.otf'])
    .pipe(fonter({
        formats: ['ttf']
    }))
    .pipe(dest(sourceFolder + '/fonts/'))
})

function fontsStyle(params) {
    let file_content = fs.readFileSync(sourceFolder + '/sass/fonts.sass');
    if (file_content == '') {
        fs.writeFile(sourceFolder + '/sass/fonts.sass', '', cb);
        return fs.readdir(path.build.fonts, function (err, items) {
            if (items) {
                let c_fontname;
                for (var i = 0; i < items.length; i++) {
                    let fontname = items[i].split('.');
                        fontname = fontname[0];
                        if (c_fontname != fontname) {
                            fs.appendFile(sourceFolder + '/sass/fonts.sass', '@include font("' + fontname + '", "' + fontname + '", "400", "normal");\r\n', cb);
                        }
                        c_fontname = fontname;
                    }
                }
            })
        }
    }
    
    function cb() { }

let build = gulp.series(clean, gulp.parallel(js, css, html, img, fonts), fontsStyle)
const watch = gulp.parallel(build, watchFiles, browserSync);

exports.fontsStyle = fontsStyle;
exports.fonts = fonts;
exports.img = img;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;