'use strict';
var fs = require('fs');
var path = require('path');
var CronJob = require('cron').CronJob;
var config = require('config');
var appRootPath = require('app-root-path');
var moment = require('moment');
var cronTimers = require('./cron-timers.js');

/*configs*/
var startTheJobAutomatically = config.get('logging.startTheJobAutomatically'); //if false, remember to call job.start(), assuming job is the variable you set the cron job to.
var fileLogPath = appRootPath.resolve(config.get('logging.file.folder'));
var retentionAmount = config.get('logging.file.retention.amount');
var retentionUnits = config.get('logging.file.retention.units');
var timezone = config.get('timeZone');

module.exports = {
    schedule: schedule
};

function schedule(config, callback) {
    configure(config);
    var job = new CronJob(cronTimers.everyHour, onTick, onComplete, startTheJobAutomatically, timezone);
    console.log('Scheduled the remove old logs job');
    callback(null, job);
}

function configure(config){
    if(config){
        fileLogPath = appRootPath.resolve(config.logging.file.folder);
        startTheJobAutomatically = config.logging.startTheJobAutomatically;
        retentionAmount = config.logging.file.retention.units;
        retentionUnits = config.logging.file.retention.units;
        timezone = config.timeZone;
    }
    else{
        console.log('remove old logs, using default configuration settings.');
    }

    if(!startTheJobAutomatically){
        console.log('cron job will not start automatically. Use job.start() to start the job.');
    }
}

function onTick(jobDone) {
    var fileRemovalThreshold = moment().subtract(retentionAmount, retentionUnits);

    fs.readdir(fileLogPath, function (err, files) {
        if (err) {
            console.error("Error reading log files for removal", err);
            return jobDone();
        }
        for (var i = 0; i < files.length; i++){
            checkIfFileNeedsToBeRemoved(files(i));
        }
    });

    function checkIfFileNeedsToBeRemoved(file, done) {
        if (file === '.gitignore') {
            return done();
        }
        var fileDateTimeString = file.split(".")[1]; // get the date from the file name
        var fileDateTime = moment(fileDateTimeString, "YYYY-MM-DDTHH");
        if (!fileDateTime) {
            console.warn('File (' + file + ') did not have a valid date, ignoring');
            return done();
        }
        if (fileDateTime > fileRemovalThreshold) {
            console.info('File (' + file + ') is still valid');
            return done();
        }
        fs.unlink(path.join(fileLogPath, file), function (err) {
            if (err) {
                console.error('Error deleting old log file: ', err);
            }
            console.info("Successfully deleted log file: " + file);
            done();
        });
    }

    function finishedRemovingOldFiles(err) {
        if (err) {
            console.error(err);
            if (jobDone) {
                return jobDone(err);
            }
        }
        if (jobDone) {
            return jobDone();
        }
    }
}

function onComplete() {
    console.log("Finished removal of old log files");
}
