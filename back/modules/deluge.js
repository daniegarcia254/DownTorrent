'use strict'

//Install Deluge as daemon (Ubuntu 16.04): http://dev.deluge-torrent.org/wiki/UserGuide/Service/systemd

const spawn = require('child_process').spawnSync;
const utils = require('./utils.js');


/*----------------------------------------------------*/
// Auxiliary functions
/*----------------------------------------------------*/

// Sanitize string for its use on command-line
function sanitize(string) {
	return string.replace(/[&><;|\//].*$/g, '');
}

// Transform Deluge "info" output into a readable JSON
function transformDelugeInfoOutputToJSON (output) {
	try {
		if (output.length <= 1) return [];

		var info = unescape(output.replace(/%0A/g,'\n').replace(/\%5B(%23)+(%7E)+%5D/g,'\n').replace(/^%20/g,'')).split('Name:');

		var result = [];
		info.forEach(function(torrent,idx){
			if (torrent.length > 100) {
				var item = torrent.split('\n');
				var tObject = {};

				tObject['name'] = item[0].trim()
				tObject['id'] = item[1].split(':')[1].trim()

				if (item[2].split(':')[1].indexOf('Downloading') >= 0 || item[2].split(':')[1].indexOf('Seeding') >= 0) {
					tObject['status'] = item[2].split(':')[1].split(' ')[1].trim()
				} else {
					tObject['status'] = item[2].split(':')[1].trim()
				}

				if (tObject['status'] === 'Downloading') {
					tObject['speed'] = [item[2].split(': ')[2].split(' ')[0],item[2].split(': ')[2].split(' ')[1]].join(' ');
					tObject['eta'] = item[2].split(': ')[4];
					tObject['size'] = {
						value: parseFloat(item[4].split(':')[1].split('/')[1].split(' ')[0]),
						measure: item[4].split(':')[1].split('/')[1].split(' ')[1]
					}
					tObject['progress'] = parseFloat(item[7].split(':')[1].trim().slice(0, -1));
				}
				else if (tObject['status'] === 'Seeding') {
					tObject['speed'] = null;
					tObject['eta'] = null;
					tObject['size'] = {
						value: parseFloat(item[4].split(':')[1].split('/')[1].split(' ')[0]),
						measure: item[4].split(':')[1].split('/')[1].split(' ')[1]
					}
					tObject['progress'] = 100;
					tObject['status'] = 'Completed';
				} else {
					tObject['speed'] = null;
					tObject['eta'] = null;
					tObject['size'] = {
						value: parseFloat(item[3].split(':')[1].split('/')[1].split(' ')[0]),
						measure: item[3].split(':')[1].split('/')[1].split(' ')[1]
					}
					tObject['progress'] = parseFloat(item[6].split(':')[1].trim().slice(0, -1));
				}
				result.push(tObject);
			}
		});
		return result;
	} catch (err) {
		return {'error': {"message":err.message,"status": 500}}
	}
}

/*----------------------------------------------------*/
// Functions that work responding to the HTTP server
/*----------------------------------------------------*/

// Add a new torrent to downloading
exports.addMagnet = function(magnetLink, dir, callback) {
	console.log("Add torrent", magnetLink, dir);

	try {
		var err = null;
		var deluge_console = spawn('deluge-console',['add','-p',dir,"'"+magnetLink+"'"])

		err = utils.handleSpawnError(deluge_console)

		if (err !== null) callback(err)
		else callback(null, {"output":deluge_console.stdout.toString()})
	}
	catch (err) {
		callback(err)
	}
}

// Get current status of torrents
exports.getInfo = function(client){
	try {
		var deluge_console = spawn('deluge-console',['info','--sort-reverse','file_progress']);
		var err = utils.handleSpawnError(deluge_console);

		if (err !== null) {
			console.log('Error getting torrents info', err);
			client.emit('info', {'error': err});
		} else {
			var result = transformDelugeInfoOutputToJSON(escape(deluge_console.stdout.toString()));
			client.emit('info', result);
		}
	} catch(err) {
		console.log('Error getting torrents info', err);
		client.emit('info', {'error': {"message":err.message,"status": 500}})
	}
}


/*----------------------------------------------------*/
// Functions that work responding to the WebService
/*----------------------------------------------------*/

// Get current status of torrents
exports.getInfo = function(client){
	try {
		var deluge_console = spawn('deluge-console',['info','--sort-reverse','file_progress']);
		var err = utils.handleSpawnError(deluge_console);

		if (err !== null) {
			console.log('Error getting torrents info', err);
			client.emit('info', {'error': err});
		} else {
			var result = transformDelugeInfoOutputToJSON(escape(deluge_console.stdout.toString()));
			client.emit('info', result);
		}
	} catch(err) {
		console.log('Error getting torrents info', err);
		client.emit('info', {'error': {"message":err.message,"status": 500}})
	}
}

// Pause the torrent with id {id}
exports.pause = function(client,id){
	console.log("Pause torrent", id);
	try {
		var deluge_console = spawn('deluge-console',['pause',sanitize(id)]);
		var err = utils.handleSpawnError(deluge_console);

		if (err !== null) {
			console.log('Error pausing torrent', err);
			client.emit('pause', {'error': err});
		} else {
			console.log('Success pausing torrent');
			client.emit('pause', deluge_console.stdout.toString());
		}
	} catch(err) {
		console.log('Error pausing torrent', err);
		client.emit('pause', {'error': {"message":err.message,"status": 500}})
	}
}

// Resume the torrent with id {id}
exports.resume = function(client,id){
	console.log("Resume torrent", id);
	try {
		var deluge_console = spawn('deluge-console',['resume',sanitize(id)]);
		console.log("DELUGE STDOUT", deluge_console.stdout.toString());
		console.log("DELUGE STDERR", deluge_console.stderr.toString());
		var err = utils.handleSpawnError(deluge_console);

		if (err !== null) {
			console.log('Error resuming torrent', err);
			client.emit('resume', {'error': err});
		} else {
			console.log('Success resuming torrent');
			client.emit('resume', deluge_console.stdout.toString());
		}
	} catch(err) {
		console.log('Error resuming torrent', err);
		client.emit('resume', {'error': {"message":err.message,"status": 500}})
	}
}

// Delete the torrent with id {id}
exports.delete = function(client,id,remove_data){
	console.log("Delete torrent", id, remove_data);
	try {
		var deluge_console = null;

		if (remove_data && remove_data === true) {
			//Delete torrent and data
			deluge_console = spawn('deluge-console',['rm','--remove_data',sanitize(id)]);
		} else {
			//Delete only torrent
			deluge_console = spawn('deluge-console',['rm',sanitize(id)]);
		}
		var err = utils.handleSpawnError(deluge_console);

		if (err !== null) {
			console.log('Error deleting torrent', err);
			client.emit('delete', {'error': err});
		} else {
			console.log('Success deleting torrent');
			client.emit('delete', deluge_console.stdout.toString());
		}
	} catch(err) {
		console.log('Error deleting torrent', err);
		client.emit('delete', {'error': {"message":err.message,"status": 500}})
	}
}