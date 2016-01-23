/*globals require, console, __dirname*/
'use strict';
var gulp = require("gulp");
var jsHint = require('gulp-jshint');
var fs = require('fs');
var npmPackage = require("./package.json");
var jsPath = ['./src/*.js'];

gulp.task('lint', function () {
    return gulp.src(jsPath)
        .pipe(jsHint())
        .pipe(jsHint.reporter('default'))
        .pipe(jsHint.reporter('fail'));
});