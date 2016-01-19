var should = require('chai').should();

var fs = require('fs');
var util = require('util');
var fn = require('hactarjs');
var CronJob = require('cron').CronJob;

/*js to test*/
var winstonLogRemover = require('../src/index.js');

/*config*/
var config = {
	"timeZone": "Africa/Johannesburg", // if you need others, check the moment-timezone npm module
	"logging": {
        "file": {
            "folder": "/logs",
            "retention": {
                "units": "minutes",
                "amount": 1
            }
        },
    	"startTheJobAutomatically": false   
    }
};

/*describe('', function() {
  it('generate 5 fake logs and delete ones older than 5 minutes', function(){
    generateFakeLogFiles('logs/fakeLogFile', 5);
    winstonLogRemover.schedule(config);
   //cc CronJob.start();
  });

});*/

generateFakeLogFiles('logs/fakeLogFile', 5);
var job = winstonLogRemover.schedule(config);
job.start();

function generateFakeLogFiles(filePath, numberToGenerate){
	for (var i = 0; i < numberToGenerate; i++){
		generateFakeLog(filePath+'.log'+i);
	}
}

function generateFakeLog(filePath){
	var exampleData = {
		exception: "An error has occurred.",
		errorCode: Math.random() * (1000 - 1) + 1,
		innerException: "A deeper error philosophy has occurred."
	};
	fn.saveFile(exampleData, filePath);
}
