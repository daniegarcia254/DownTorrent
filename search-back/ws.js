'use strict'

const spawn = require('child_process').spawnSync
const errorHandler = require('./errorHandler.js')()

var clam = require('clamscan')({
		remove_infected: true, // If true, removes infected files
		//quarantine_infected: false, // False: Don't quarantine, Path: Moves files to this place.
		//scan_log: null, // Path to a writeable log file to write scan results into
		debug_mode: true, // Whether or not to log info/debug/error msgs to the console
		//file_list: null, // path to file containing list of files to scan (for scan_files method)
		scan_recursively: true, // If true, deep scan folders recursively
		clamscan: {
				path: '/usr/bin/clamscan', // Path to clamscan binary on your server
				//db: null, // Path to a custom virus definition database
				scan_archives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
				active: true // If true, this module will consider using the clamscan binary
		},
		preference: 'clamscan' // If clamdscan is found and active, it will be used by default
});

module.exports = function (io) {
	var module = {};
	var io = io;
	var infoIntervalId = null;

	module.connect = function () {
		io.on('connection', function(client) {
			console.log('Client connected...');
			getInfo(client);
			startInfoInterval(client);
			closeInfoSocket(client);
			pause(client);
			resume(client);
			del(client);
			scan(client);
		});
	};

	function getInfo (client) {
		client.on('getInfo', function(data) {
			console.log('getInfo');
			getDelugeInfo(client);
		});
	}

	function pause(client){
		client.on('pause', function(data){
			console.log('pause',data);
			pauseTorrent(client,data);
		});
	}

	function resume(client){
		client.on('resume', function(data){
			console.log('resume',data);
			resumeTorrent(client,data);
		});
	}

	function del(client){
		client.on('delete', function(data){
			console.log('delete',data);
			deleteTorrent(client,data);
		});
	}

	function scan(client){
		client.on('scan', function(data){
			console.log('delete',data);
			scanTorrent(client,data.username,data.torrent);
		});
	}

	function startInfoInterval (client) {
		client.on('startInfoInterval', function(data) {
				console.log('startInfoInterval', infoIntervalId === null);
			if (infoIntervalId === null) {
				infoIntervalId = setInterval(function(){
					getDelugeInfo(client);
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

	function getDelugeInfo(client){
		try {
			var deluge_console = spawn('deluge-console',['info','--sort-reverse','file_progress']);
			var err = errorHandler.handleSpawn(deluge_console);

			if (err !== null) {
				console.log('Error getting torrents info', err);
				client.emit('info', {'error': err});
			} else {
				//console.log('Success getting deluge torrents info');
				var result = transformDelugeInfoOutputToJSON(escape(deluge_console.stdout.toString()));
				client.emit('info', result);
			}
		} catch(err) {
			console.log('Error getting torrents info', err);
			client.emit('info', {'error': {"message":err.message,"status": 500}})
		}
	}

	function pauseTorrent(client, id){
		console.log("Pause torrent", id);
		try {
			var deluge_console = spawn('deluge-console',['pause',sanitize(id)]);
			var err = errorHandler.handleSpawn(deluge_console);

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

	function resumeTorrent(client, id){
		console.log("Resume torrent", id);
		try {
			var deluge_console = spawn('deluge-console',['resume',sanitize(id)]);
			var err = errorHandler.handleSpawn(deluge_console);

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

	function deleteTorrent(client, data){
		console.log("Delete torrent", data);
		try {
			var deluge_console = null;
			if (data.remove_data && data.remove_data === true) {
				deluge_console = spawn('deluge-console',['rm','--remove_data',sanitize(data.id)]);
			} else {
				deluge_console = spawn('deluge-console',['rm',sanitize(data.id)]);
			}
			var err = errorHandler.handleSpawn(deluge_console);

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

	function scanTorrent(client, username, torrent){
		console.log("Scan torrent", sanitize(username), sanitize(torrent.name));
		try {
			clam.scan_dir('/home/'+sanitize(username)+'/downloads/'+torrent.name, function(err, good_files , bad_files ) {
		 		if (err) {
					console.log('Error scaning torrent', err);
					client.emit('scan', {'error': {"message":err.message,"status": 500}});
				} else {
					console.log('Success scaning torrent');
					client.emit('scan', {good_files: good_files, bad_files: bad_files});
				}
			});
		} catch(err) {
			console.log('Error resuming torrent', err);
			client.emit('resume', {'error': {"message":err.message,"status": 500}})
		}
	}

	function sanitize(string) {
		return string.replace(/[&><;|\//].*$/g, '');
	}

	function getValidPath(string) {
		return sanitize(string).replace(/([\s\(\)',*\{\}?¿¡!^+])/g,'\\$1');
	}

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

	return module;
};
