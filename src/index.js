'use strict';
/**
 * Created by jason.chalom on 2016-01-19.
 *
 * Main Entry Point to library / tool
 */
var async = require('async');
var removeOldLogs = require('./remove-old-logs.job.js');
var exposed = {
  schedule: schedule
};

module.exports = exposed;

function schedule(config){
	var callback = {};
	async.waterfall([removeOldLogs.schedule(config)], callback);
	return callback;
}
