'use strict'

const spawn = require('child_process').spawnSync

module.exports = function() {
	var module = {};

	module.handleSpawnError = function(result) {
		if (result.error) {
			return {"message":result.error.message, "status": result.error.errno}
		}
		else if (result.stderr.toString() !== '') {
			return {"message":result.stderr.toString(),"status": 500}
		}
		else if (result.status !== 0) {
			return {"message":result.stdout.toString(),"status": result.status}
		}
		else if (result.stdout.toString().indexOf('Unknown command') !== -1) {
			return {"message":result.stdout.toString(),"status": 500}
		}
		else if (result.stdout.toString().indexOf("doesn't exist") !== -1) {
			return {"message":result.stdout.toString(),"status": 404}
		}
		else if (result.stdout.toString().indexOf('Error') !== -1) {
			return {"message":result.stdout.toString(),"status": 500}
		} else {
			return null;
		}
	}

	module.sanitize = function(string) {
		return string.replace(/[&><;|\//].*$/g, '');
	}

	module.sanitizeURI = function(string) {
		return string.replace(/[><;|\//].*$/g, '');
	}

	module.checkValidUser = function(username){
		var username = this.sanitize(username);
		if (username === 'root') return false
		else if (process.env.VALID_USERS.indexOf(username) === -1) return false
		else return true
	}

	module.checkAvailableSpace = function(){
		var check = spawn("df", ["-h","/home"]);
		var err = this.handleSpawnError(check)
		if (err !== null) {
			console.log("Error testing available space", err)
			return false;
		} else {
			console.log("Success testing available space", check.stdout.toString())
			var line = check.stdout.toString().split('\n')[1];
			var spacePercentAvailable = (100 - parseFloat(line.split(' ')[line.split(' ').length-2].split('%')[0]))
			if (spacePercentAvailable < 10) {
				return false;
			} else {
				return true;
			}
		}
	}

	return module;
}
