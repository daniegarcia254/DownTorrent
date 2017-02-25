'use strict'

var express = require('express')
var router = express.Router()
var PirateBay = require('thepiratebay')

const spawn = require('child_process').spawnSync

var errorHandler = function(result) {
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

var sanitize = function(string) {
	return string.replace(/[&><;|\//].*$/g, '');
}

var sanitizeURI = function(string) {
	return string.replace(/[><;|\//].*$/g, '');
}

// Main search
router.get('/', function (req, res) {
	var q = req.query.q;
	console.log("Search torrent", q);
	PirateBay.search(q)
	.then(results => {
		console.log("Success searching PirateBay", results);
		res.send(results);
	})
	.catch(err => {
		console.log("Error searching PirateBay: ", err)
		res.send(err);
	})
})

router.get('/user/login/:username', function(req, res) {
	var username = sanitize(req.params.username);
	
	console.log("Check user", username);

	var id_user = spawn('id',[username]);

	var err = errorHandler(id_user);

	if (username === 'root') {
		err = {"message": "Login not allowed with user 'root'","status": 401}
	}

	if (err !== null) {
		console.log("Error checking user", err);
		res.send({"error": err});
	} else {
		res.send({"output":id_user.stdout.toString()});
	}
});

router.post('/download', function(req, res) {
	var username = sanitize(req.body.username);
	var torrent = sanitizeURI(req.body.torrent);
	
	console.log("Download", username, torrent);

	var err = null;

	if (username === 'root') {
		err = {"message": "No action is allowed with user 'root'","status": 401}
		res.send({"error": err});
	} else {
		var deluge_console = spawn('deluge-console',['add','-p','/home/'+username+'/downloads/',"'"+torrent.magnetLink+"'"]);

		err = errorHandler(deluge_console);

		if (err !== null) {
			console.log("Error adding torrent", err);
			res.send({"error": err});
		} else {
			res.send({"output":deluge_console.stdout.toString()});
		}
	}
});

module.exports = router
