'use strict'

module.exports = function() {
	var module = {};

	module.handleSpawn = function(result) {
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
		else if (result.stdout.toString().indexOf('Error') !== -1) {
			return {"message":result.stdout.toString(),"status": 500}
		} else {
			return null;
		}
	}

	return module;
}
