'use strict'

const utils = require('./modules/utils.js');
const transmission = require('./modules/transmission.js');
const awsS3Handler = require('./modules/awsS3Handler.js');
const clamav = require('./modules/clamav.js');

module.exports = function(io) {
	var module = {};
	var client = null;
	var infoIntervalId = null,
			uploadIntervalId = null;

	function getInfo (client) {
		client.on('getInfo', function(data) {
			console.log('getInfo',data);
			transmission.getInfo(client);
		});
	}

	function pause(client){
		client.on('pause', function(data){
			console.log('pause',data);
			transmission.pause(client,data.id);
		});
	}

	function resume(client){
		client.on('resume', function(data){
			console.log('resume',data);
			transmission.resume(client,data.id);
		});
	}

	function del(client){
		client.on('delete', function(data){
			console.log('delete',data);
			transmission.delete(client,data.id,data.remove_data);
		});
	}

	function scan(client){
		client.on('scan', function(data){
			console.log('scan',data);
			if (!utils.checkValidUser(data.username)){
				var err = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
				client.emit('upload', {'error': err})
			} else {
				clamav.scanFiles(data.username, data.torrent, function(err,result){
					if (err) {
						console.log('Error scanning torrent', err)
						client.emit('scan', {'error': {'message':err.message,'status': 500}})
					} else {
						console.log('Success scanning torrent', result)
						client.emit('scan', result);
					}
				});
			}
		});
	}

	function upload(client){
		client.on('upload', function(data){
			console.log('upload',data);
			if (!utils.checkValidUser(data.username)){
				var err = { 'message': 'Invalid username. The user is no registered in the system.','status': 401}
				client.emit('upload', {'error': err})
			} else {
				awsS3Handler.upload(client, data.client, data.username, data.torrent, function(err, result){
					if (err) {
						console.log('Error uploading torrent', err)
						client.emit('upload', {'error': {'message':err.message,'status': 500}})
					} else {
						console.log('Success uploading torrent', result)
						client.emit('upload', result);
					}
				});
			}
		});
	}

	function startInfoInterval (client) {
		client.on('startInfoInterval', function(data) {
			console.log('startInfoInterval', infoIntervalId === null);
			if (infoIntervalId === null) {
				infoIntervalId = setInterval(function(){
					transmission.getInfo(client);
				}, 5000);
			}
		});
	}

	function closeInfoSocket (client) {
		client.on('closeInfoSocket', function(data) {
			console.log('closeInfoSocket');
			if (infoIntervalId !== null) {
				clearInterval(infoIntervalId);
			}
			client.emit('closeInfoSocket', infoIntervalId);
			infoIntervalId = null;
		});
	}

	module.connect = function() {
		console.log('Initializating websocket...');
		io.on('connection', function(client) {
			console.log('Client connected...');
			client = client;
			getInfo(client);
			startInfoInterval(client);
			closeInfoSocket(client);
			pause(client);
			resume(client);
			del(client);
			scan(client);
			upload(client);
		});
	};

	return module;
};
