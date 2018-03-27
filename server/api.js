'use strict'

const express = require('express');
const router = express.Router();

const fs = require('fs');
const proc = require('child_process');
const https = require('https');
const utils = require('./modules/utils.js');
const transmission = require('./modules/transmission.js');
const awsS3Handler = require('./modules/awsS3Handler.js');

// Main search
router.get('/search/rarbg', function (req, res) {
	const reqToken = https.get({
		host: process.env.TORRENTAPI_HOST,
		path: process.env.TORRENTAPI_TOKEN_PATH,
		headers: {
		   'User-Agent': 'https://github.com/grantholle/rarbg'
	  	}
	}, (resToken) => {
		let body = '';
		console.log('Get token response tatus:', resToken.statusCode);
		resToken.setEncoding('utf8');
		resToken.on('data', (chunk) => body += chunk);
		resToken.on('end', () => {
		   console.log('Successfully token', body);
		   var token = JSON.parse(body).token;
		   
		   var url = process.env.TORRENTAPI_SEARCH_PATH;
		   url += '&search_string=' + encodeURIComponent(req.query.q);
		   url += '&token=' + token;
		   
		   setTimeout(function(){
			   	const reqSearch = https.get({
				   	host: process.env.TORRENTAPI_HOST,
				   	path: url,
				   	headers: {
					   'User-Agent': 'https://github.com/grantholle/rarbg'
				   	}
				}, (resSearch) => {
					let body = '';
					console.log('Search response status:', resSearch.headers);
					resSearch.setEncoding('utf8');
					resSearch.on('data', (chunk) => body += chunk);
					resSearch.on('end', () => {
						console.log('Successfully search', body);
						res.send(body);
				   	});
			   	});
				reqSearch.on('error', function(err){
					console.log('Error searching torrent', err);
					res.status(500).send(err);
				});
				reqSearch.end();
			},500);
		});
	});
	reqToken.on('error', function(err){
		console.log('Error getting token', err);
		res.status(500).send(err);
	});
	reqToken.end();
});

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
