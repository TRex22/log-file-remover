'use strict';
var fs = require('fs');
var path = require('path');
var CronJob = require('cron').CronJob;
var config = require('config');
var appRootPath = require('app-root-path');
var moment = require('moment');
var cronTimers = require('./cron-timers.js');

/*configs*/
var startTheJobAutomatically = true; //if false, remember to call job.start(), assuming job is the variable you set the cron job to.
var fileLogPath = appRootPath.resolve(config.get('logging.file.folder'));
var retentionAmount = config.get('logging.file.retention.amount');
var retentionUnits = config.get('logging.file.retention.units');
var cronTime = config.get('logging.cronTime');
var timezone = config.get('timeZone');
var timeToTake = config.get('logging.file.timeToTake');
var fileRemovalThreshold = null;

var exposed = {
  schedule: schedule
};

module.exports = exposed;

function schedule(config, callback) {
    configure(config);
    var job = new CronJob(cronTime, onTick, onComplete, startTheJobAutomatically, timezone);
    console.log('Scheduled the remove old logs job');
}

function configure(config){
    if(config){
        fileLogPath = appRootPath.resolve(config.logging.file.folder);
        retentionAmount = config.logging.file.retention.units;
        retentionUnits = config.logging.file.retention.units;
        timezone = config.timeZone;
        cronTime = config.logging.cronTime;
        timeToTake = config.logging.file.timeToTake;
    }
    else{
        console.log('remove old logs, using default configuration settings');
    }

    if(!startTheJobAutomatically){
        console.log('cron job will not start automatically. Use job.start() to start the job');
    }

    fileRemovalThreshold = moment().subtract(retentionAmount, retentionUnits);
    console.log('fileRemovalThreshold: '+fileRemovalThreshold);
}

function onTick(jobDone) {
    
    fs.readdir(fileLogPath, function (err, files) {
        if (err) {
            console.error("Error reading log files for removal", err);
            return jobDone();
        }
        for (var i = 0; i < files.length; i++){
            checkIfFileNeedsToBeRemoved(files[i]);
        }
    });

    function checkIfFileNeedsToBeRemoved(file, done) {
        if (file === '.gitignore') {
            console.warn("This is the .gitignore file, won't delete");
        }
        else{
        	var fileDateTimeString = null;
        	var fileDateTime = null;
        	if(timeToTake === 'mtime'){
        		fileDateTimeString = fs.statSync(path.join(fileLogPath, file)).mtime.getTime(); //get the last modified date
        		fileDateTime = fileDateTimeString;
        	}
        	else if(timeToTake === 'ctime'){
        		fileDateTimeString = fs.statSync(path.join(fileLogPath, file)).ctime.getTime(); //get the created date
        		fileDateTime = fileDateTimeString;
        	}
        	else if(timeToTake === 'fileName'){
        		fileDateTimeString = file.split(".")[1]; // get the date from the file name
        		fileDateTime = moment(fileDateTimeString, "YYYY-MM-DDTHH");
        	}
        	else{
        		console.error('Incorrect timeToTake specified, please specifiy either mtime or ctime');
        		return;
        	}

	        console.error("fileDateTimeString: "+fileDateTimeString+"\nfileDateTime: "+fileDateTime);
	        if (!fileDateTime || fileDateTime < 1) {
	            console.warn('File (' + file + ') does not have a valid date, ignoring');
	        }
	        else{
	        	if (fileDateTime < fileRemovalThreshold) {
	            	console.info('File (' + file + ') is still valid');
		        }
		        else{
		        	fs.unlink(path.join(fileLogPath, file), function (err) {
			            if (err) {
			                console.error('Error deleting old log file: ', err);
			            }
			            console.info("Successfully deleted log file: " + file);
		        	});
		        }	        
	        }
        }
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
