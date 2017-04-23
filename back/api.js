'use strict'

const express = require('express')
const router = express.Router()

const fs = require('fs')
const PirateBay = require('thepiratebay')
const spawnSync = require('child_process').spawnSync
const utils = require('./modules/utils.js')()
const deluge = require('./modules/deluge.js')()
const transmission = require('./modules/transmission.js')()
const awsS3Handler = require('./modules/awsS3Handler.js')

// Main search
router.get('/search/piratebay', function (req, res) {
	var q = req.query.q;
	console.log("Search PirateBay torrent", q);
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

	var username = utils.sanitize(req.params.username);
	console.log("Check user", username)

	if (!utils.checkValidUser(username)){
		console.log("User " + username + " is not between the valid ones");
		var errAuth = { "message": "Invalid username. The user is no registered in the system.","status": 401};
		res.status(401).send(errAuth);
	} else {
		var id_user = spawnSync('id',[username])

		var err = utils.handleSpawnError(id_user)

		if (err !== null) {
			console.log("Error checking user", err)
			res.status(500).send({"error": err})
		}
		else {
			console.log("Success checking user", id_user.stdout.toString())
			res.send({"output":id_user.stdout.toString()})
		}
	}
});

router.post('/deluge/download', function(req, res) {
	var username = utils.sanitize(req.body.username),
			torrent = req.body.torrent,
			magnetLink = utils.sanitizeURI(torrent.magnetLink),
			dir = '/home/'+username+'/downloads/';

	console.log("Download", username, torrent)

	var err = null;

	if (!utils.checkValidUser(username)){
		var err = { "message": "Invalid username. The user is no registered in the system.","status": 401}
		res.send({"error": err})
	} else {
		deluge.addMagnet(magnetLink, dir, function(err, result){
			if (err) {
				console.log("Error add torrent", err)
				res.send({"error": err})
			} else {
				console.log("Success add torrent", result)
				res.send(result);
			}
		});
	}
});

router.post('/transmission/download', function(req, res) {
	var username = utils.sanitize(req.body.username),
			torrent = req.body.torrent,
			magnetLink = utils.sanitizeURI(torrent.magnetLink),
			dir = '/home/'+username+'/downloads/';

	console.log("Download", username, torrent)

	if (!utils.checkValidUser(username)){
		var err = { "message": "Invalid username. The user is no registered in the system.","status": 401}
		res.send({"error": err})
	} else if (!utils.checkAvailableSpace()){
		var err = { "message": "Can't start a new download. No available space on disk.","status": 403}
		res.send({"error": err})
	}else {
		transmission.addMagnet(magnetLink, dir, function(err, result){
			if (err) {
				console.log("Error add torrent", err)
				res.send({"error": err})
			} else {
				console.log("Success add torrent", result)
				res.send(result);
			}
		});
	}
});

router.get('/links/:username', function(req, res) {
	var username = utils.sanitize(req.params.username);

	if (!utils.checkValidUser(username)){
		var err = { "message": "Invalid username. The user is no registered in the system.","status": 401}
		res.send({"error": err})
	} else {
		awsS3Handler.getLinks(username, function(err, links){
			if (err) {
				console.log("Error getting links", err)
				res.send({"error": err})
			} else {
				console.log("Success getting links", links)
				res.send(links);
			}
		});
	}
});

router.get('/links/:username/:key', function(req, res) {
	var username = utils.sanitize(req.params.username),
			key = req.params.key;

	if (!utils.checkValidUser(username)){
		var err = { "message": "Invalid username. The user is no registered in the system.","status": 401}
		res.send({"error": err})
	} else {
		res.send(awsS3Handler.getFileURL(username, key));
	}
});

router.delete('/links/:username/:key', function(req, res) {
	var username = utils.sanitize(req.params.username),
			key = req.params.key;

	if (!utils.checkValidUser(username)){
		var err = { "message": "Invalid username. The user is no registered in the system.","status": 401}
		res.send({"error": err})
	} else {
		awsS3Handler.deleteS3Object(username, key, function(err, result){
			if (err) {
				console.log("Error deleting S3 Object", err)
				res.send({"error": err})
			} else {
				console.log("Success deleting S3 Object", result)
				res.send(result);
			}
		});
	}
});

module.exports = router
