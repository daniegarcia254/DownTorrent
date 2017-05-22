'use strict'

//Install Transmission in Ubuntu(16.04): https://help.ubuntu.com/community/TransmissionHowTo#Transmission_Command_Line

const _ = require('underscore');
const prettyBytes = require('pretty-bytes');
const prettyMs = require('pretty-ms');

const Transmission = require('transmission');
const transmission = new Transmission({
	host: process.env.TRANSMISSION_HOST || 'localhost',
	port: process.env.TRANSMISSION_PORT || 9091,
	username: process.env.TRANSMISSION_USER,
	password: process.env.TRANSMISSION_PWD,
});

const arrayStatus = {
	'stopped':'STOPPED', 'check_wait':'CHECK_WAIT', 'check':'CHECK', 'download_wait':'DOWNLOAD_WAIT',
	'download':'DOWNLOAD', 'seed_wait':'SEED_WAIT', 'seed':'SEED', 'isolated':'ISOLATED'};


/*----------------------------------------------------*/
// Auxiliary functions
/*----------------------------------------------------*/

// Get torrent state
function getStatusType(type){
		//return transmission.statusArray[type]
		if(type === 0){
				return 'Paused';
		} else if(type === 1){
				return 'Checking';
		} else if(type === 2){
				return 'Checked';
		} else if(type === 3){
				return 'Waiting';
		} else if(type === 4){
				return 'Downloading';
		} else if(type === 5){
				return 'Seeding';
		} else if(type === 6){
				return 'Completed';
		} else if(type === 7){
				return 'Isolated';
		} else {
			return  '';
		}
}

/*----------------------------------------------------*/
// Functions that work responding to the HTTP server
/*----------------------------------------------------*/

exports.transmission = transmission;

// Add a new torrent to downloading
exports.addMagnet = function(magnetLink, dir, callback) {
	console.log('Add torrent', magnetLink, dir);
	transmission.addUrl(magnetLink, {'download-dir':dir}, callback);
}


/*----------------------------------------------------*/
// Functions that work responding to the WebService
/*----------------------------------------------------*/

// Get current status of torrents
exports.getInfo = function(client) {
	try {
		transmission.get(function(err, result) {
			if (err) { client.emit('info', {'error': {'message':err.message,'status': 500}}); }
			else {
				var torrents = [];
				if(result.torrents.length > 0){
					_.each(result.torrents, function(t){
						var torrent = {};
						torrent.id = t.id;
						torrent.name = t.name;
						torrent.size = t.totalSize === 0 ? '-' : prettyBytes(t.totalSize);
						torrent.status = t.totalSize === 0 ? 'Checking' : (t.isFinished ? 'Completed' : getStatusType(t.status));
						torrent.progress = t.percentDone*100;
						torrent.speed = t.totalSize === 0 ? '-' : prettyBytes(t.rateDownload)+'/s';
						torrent.magnetLink = t.magnetLink;
						torrent.eta = t.eta < 0 ? '-' : prettyMs(t.eta*1000);
						torrents.push(torrent);
					});
				}
				client.emit('info', torrents);
			}
		});
	} catch(err) {
		console.log('Error getting torrents info', err);
		client.emit('info', {'error': {'message':err.message,'status': 500}});
	}
}

// Pause the torrent with id {id}
exports.pause = function(client, id){
	console.log('Pause torrent', id);
	transmission.stop(id, function(err, result){
		if (err) { client.emit('pause', {'error': {'message':err.message,'status': 500}}); }
		else { client.emit('pause', id); }
	});
}

// Resume the torrent with id {id}
exports.resume = function(client, id){
	console.log('Resume torrent', id);
	transmission.start(id, function(err, result){
		if (err) { client.emit('resume', {'error': {'message':err.message,'status': 500}}); }
		else { client.emit('resume', id); }
	});
}

// Delete the torrent with id {id}
exports.delete = function(client, id, removeData){
	console.log('Delete torrent', id, removeData);

	//Delete torrent and data
	if (removeData && removeData === true) {
		transmission.remove(id, true, function(err, result){
			if (err) { client.emit('delete', {'error': {'message':err.message,'status': 500}}); }
			else { client.emit('delete', id); }
		});
	//Delete only torrent
	} else {
		transmission.remove(id, function(err, result){
			if (err) { client.emit('delete', {'error': {'message':err.message,'status': 500}}); }
			else { client.emit('delete', id); }
		});
	}
}
