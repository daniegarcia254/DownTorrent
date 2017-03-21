'use strict'

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

	return module;
}
