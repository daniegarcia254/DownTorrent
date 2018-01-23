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

const arrayStatus = ['Paused','Checking','Checked','Waiting','Downloading','Seeding','Completed','Isolated'];


/*----------------------------------------------------*/
// Auxiliary functions
/*----------------------------------------------------*/

// Get torrent state
function getStatusType(type){
		if(type >= 0 && type <= 7){
			return arrayStatus[type];
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
						torrents.push({
							id: t.id,
							name: t.name,
							size: t.totalSize === 0 ? '-' : prettyBytes(t.totalSize),
							status: t.totalSize === 0 ? 'Checking' : (t.isFinished ? 'Completed' : getStatusType(t.status)),
							progress: t.percentDone*100,
							speed: t.totalSize === 0 ? '-' : prettyBytes(t.rateDownload)+'/s',
							magnetLink: t.magnetLink,
							eta: t.eta < 0 ? '-' : prettyMs(t.eta*1000)
						});
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
