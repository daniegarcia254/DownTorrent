'use strict'

const express = require('express');
const router = express.Router();

const fs = require('fs');
const fetch = require('node-fetch');
const proc = require('child_process');
const utils = require('./modules/utils.js');
const transmission = require('./modules/transmission.js');
const awsS3Handler = require('./modules/awsS3Handler.js');

// Main search
router.get('/search/rarbg', function (req, res) {
	var q = req.query.q;
	console.log('Search torrent in Rarbg', q);
	var baseGetTokenUrl = process.env.TORRENT_API_URL;
	var baseSearchUrl = baseGetTokenUrl + process.env.TORRENT_SEARCH_OPTIONS;
	var tokenUrl = baseGetTokenUrl + '&get_token=get_token';
	console.log('Get token URL: ', tokenUrl);
	fetch(tokenUrl)
    .then(resToken => resToken.json())
	.then(json => {
		console.log('Token: ', json);
		var searchUrl = baseSearchUrl + '&search_string=' + encodeURIComponent(q) + '&token=' + json.token;
		console.log('Search URL: ', searchUrl);
		fetch(searchUrl)
		.then(resResults => resResults.json())
		.then(json => {
			console.log('Search results: ', (json && json.torrent_results) ? json.torrent_results.length : json);
			res.send(json.torrent_results)
		})
		.catch(err => {
			console.log('Error searching in Rarbg: ', err);
			res.send(err)
		});
	})
	.catch(err => {
		console.log('Error getting token: ', err);
		res.send(err)
	});
})

router.get('/user/login/:username', function(req, res) {

	var userName = utils.sanitize(req.params.username);
	console.log('Check user', userName);

	if (!utils.checkValidUser(userName)){
		console.log('User ' + userName + ' is not between the valid ones');
		var errAuth = { 'message': 'Invalid username. The user is no registered in the system.','status': 401};
		res.status(401).send(errAuth);
	} else {
		var spawnSync = proc.spawnSync;
		var checkUserResult = spawnSync('id',[userName]);

		var err = utils.handleSpawnError(checkUserResult);

		if (err !== null) {
			console.log('Error checking user:', err);
			res.status(500).send({'error': err});
		}
		else {
			console.log('Success checking user:', userName);
			res.send({'output':checkUserResult.stdout.toString()});
		}
	}
});

router.post('/transmission/download', function(req, res) {
	var userName = utils.sanitize(req.body.username),
			torrent = req.body.torrent,
			magnetLink = utils.sanitizeURI(torrent.download),
			dir = '/home/'+userName+'/downloads/';

	if (!utils.checkValidUser(userName)){
		var errAuthMsg = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
		res.status(401).send({'error': errAuthMsg})
	} else if (!utils.checkAvailableSpace()){
		var errSpace = { 'message': 'Can\'t start a new download. No available space on disk.','status': 403}
		res.status(403).send({'error': errSpace})
	} else if ((userName === 'test' || userName === 'demo') && !utils.checkMaxTorrentSize(torrent.size)) {
		var errMaxSize = { 'message': 'The max file size for a download with the "test" user is 10MB.','status': 403}
		res.status(403).send({'error': errMaxSize})
	} else {
		transmission.addMagnet(magnetLink, dir, function(err, result){
			if (err) {
				console.log('Error adding torrent:', err)
				res.status(500).send({'error': err})
			} else {
				console.log('Success adding torrent:', result)
				res.send(result);
			}
		});
	}
});

router.get('/links/:username', function(req, res) {
	var userName = utils.sanitize(req.params.username);

	if (!utils.checkValidUser(userName)){
		var errAuthMsg = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
		res.status(401).send(errAuthMsg)
	} else {
		awsS3Handler.getLinks(userName, function(err, links){
			if (err) {
				console.log('Error getting links:', err)
				res.status(500).send({'error': err})
			} else {
				console.log('Success getting links:', links)
				res.send(links);
			}
		});
	}
});

router.get('/links/:username/:key', function(req, res) {
	var userName = utils.sanitize(req.params.username),
			key = req.params.key;

	if (!utils.checkValidUser(userName)){
		var errAuthMsg = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
		res.status(401).send(errAuthMsg)
	} else {
		res.send(awsS3Handler.getFileURL(userName, key));
	}
});

router.delete('/links/:username/:key', function(req, res) {
	var userName = utils.sanitize(req.params.username),
			key = req.params.key;

	if (!utils.checkValidUser(userName)){
		var errAuthMsg = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
		res.status(401).send(errAuthMsg)
	} else {
		awsS3Handler.deleteS3Object(userName, key, function(err, result){
			if (err) {
				console.log('Error deleting S3 Object:', err)
				res.status(500).send({'error': err})
			} else {
				console.log('Success deleting S3 Object:', result)
				res.send(result);
			}
		});
	}
});

module.exports = router
