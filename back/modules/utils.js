'use strict'

const spawn = require('child_process').spawnSync;

exports.handleSpawnError = function(result) {
	if (result.error) {
		return {'message':result.error.message, 'status': result.error.errno};
	}
	else if (result.stderr.toString() !== '') {
		return {'message':result.stderr.toString(),'status': 500};
	}
	else if (result.status !== 0) {
		return {'message':result.stdout.toString(),'status': result.status};
	}
	else if (result.stdout.toString().indexOf('Unknown command') !== -1) {
		return {'message':result.stdout.toString(),'status': 500};
	}
	else if (result.stdout.toString().indexOf('doesn\'t exist') !== -1) {
		return {'message':result.stdout.toString(),'status': 404};
	}
	else if (result.stdout.toString().indexOf('Error') !== -1) {
		return {'message':result.stdout.toString(),'status': 500};
	} else {
		return null;
	}
}

exports.sanitize = function(str) {
	return str.replace(/[\]\[&><;|\//].*$/g, '');
}

exports.sanitizeURI = function(string) {
	return string.replace(/[\]\[><;|\//].*$/g, '');
}

exports.checkValidUser = function(userName){
	if (!userName) { return false; }
	userName = this.sanitize(userName);

	if (userName === 'root') {
		return false;
	} else if (process.env.VALID_USERS.indexOf(userName) === -1) {
		return false;
	} else {
		return true;
	}
}

exports.checkAvailableSpace = function(){
	var check = spawn('df', ['-h','/home']);
	var err = this.handleSpawnError(check);
	if (err !== null) {
		console.log('Error testing available space', err);
		return false;
	} else {
		console.log('Success testing available space', check.stdout.toString());
		var line = check.stdout.toString().split('\n')[1];
		var spacePercentAvailable = (100 - parseFloat(line.split(' ')[line.split(' ').length-2].split('%')[0]));
		if (spacePercentAvailable < 10) {
			return false;
		} else {
			return true;
		}
	}
}

exports.checkMaxTorrentSize = function(size){
	var size_temp = escape(size).replace(/%20/g,' ').replace(/%A0/g,' ').split(' '),
			size_value = parseFloat(size_temp[0]);

	switch (size_temp[1]) {
		case 'MiB': size_value = size_value * 1024; break;
		case 'GiB': size_value = size_value * 1024 * 1024; break;
	}

	return size_value <= 10240;
}
