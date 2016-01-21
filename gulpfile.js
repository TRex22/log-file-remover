/*globals require, console, __dirname*/
'use strict';
var util = require("util");
var gulp = require("gulp");
var jsHint = require('gulp-jshint');
var argv = require('yargs').argv;
var npm = require('npm');
var _ = require('lodash');
var npmPackage = require("./package.json");
var jsPath = ['./src/*.js'];

gulp.task('lint', function () {
    return gulp.src(jsPath)
        .pipe(jsHint())
        .pipe(jsHint.reporter('default'))
        .pipe(jsHint.reporter('fail'));
});

gulp.task('npmPublish', function (callback) {
    var username = argv.username;
    var password = argv.password;
    var email = argv.email;
    if (!username) {
        var usernameError = new Error("Username is required as an argument --username exampleUsername");
        return callback(usernameError);
    }
    if (!password) {
        var passwordError = new Error("Password is required as an argument --password examplePassword");
        return callback(passwordError);
    }
    if (!email) {
        var emailError = new Error("Email is required as an argument --email example@email.com");
        return callback(emailError);
    }
    var uri = "http://registry.npmjs.org/";
    npm.load(null, function (loadError) {
        if (loadError) {
            return callback(loadError);
        }
        var auth = {
            username: username,
            password: password,
            email: email,
            alwaysAuth: true
        };
        var addUserParams = {
            auth: auth
        };
        npm.registry.adduser(uri, addUserParams, function (addUserError, data, raw, res) {
            if (addUserError) {
                return callback(addUserError);
            }
            var packageJson = _.clone(require('./package.json'));
            npm.commands.pack([], function (packError) {
                if (packError) {
                    return callback(packError);
                }
                var fileName = packageJson.name.substring(1).replace(/\//g, '-') + '-' + packageJson.version + '.tgz';
                var bodyPath = require.resolve('./' + fileName);
                var body = fs.createReadStream(bodyPath);
                var publishParams = {
                    metadata: packageJson,
                    access: 'restricted',
                    body: body,
                    auth: auth
                };
                npm.registry.publish(uri, publishParams, function (publishError, resp) {
                    if (publishError) {
                        return callback(publishError);
                    }
                    console.log("Publish successful: " + JSON.stringify(resp));
                    return callback();
                });
            });
        });
    });
});