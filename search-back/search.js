'use strict'

const express = require('express')
const router = express.Router()
const PirateBay = require('thepiratebay')
const errorHandler = require('./errorHandler')()

const spawn = require('child_process').spawnSync

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
		console.log("Success searching PirateBay", results.length)
		res.send(results)
	})
	.catch(err => {
		console.log("Error searching PirateBay: ", err)
		res.send(err)
	})
})

router.get('/user/login/:username', function(req, res) {
	var username = sanitize(req.params.username);
	
	console.log("Check user", username)

	var id_user = spawn('id',[username])

	var err = errorHandler.handleSpawn(id_user)

	if (username === 'root') {
		err = {"message": "Login not allowed with user 'root'","status": 401}
	}

	if (err !== null) {
		console.log("Error checking user", err)
		res.send({"error": err})
	} else {
		console.log("Success checking user", id_user.stdout.toString())
		res.send({"output":id_user.stdout.toString()})
	}
});

router.post('/download', function(req, res) {
	var username = sanitize(req.body.username);
	var torrent = req.body.torrent;
	var magnetLink = sanitizeURI(torrent.magnetLink);
	
	console.log("Download", username, torrent)

	var err = null;

	if (username === 'root') {
		err = {"message": "No action is allowed with user 'root'","status": 401}
		res.send({"error": err})
	} else {
		var deluge_console = spawn('deluge-console',['add','-p','/home/'+username+'/downloads/',"'"+magnetLink+"'"])

		err = errorHandler.handleSpawn(deluge_console)

		if (err !== null) {
			console.log("Error adding torrent", err)
			res.send({"error": err})
		} else {
			console.log("Success getting torrents info", deluge_console.stdout.toString())
			res.send({"output":deluge_console.stdout.toString()})
		}
	}
});

module.exports = router
