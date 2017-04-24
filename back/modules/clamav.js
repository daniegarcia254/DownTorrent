'use strict'

const utils = require('./utils.js');

// Create ClamAV client
const clam = require('clamscan')({
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

exports.scanFiles = function(username, torrent, callback){
	console.log("Scan files", utils.sanitize(username), utils.sanitize(torrent.name));
	var dir = '/home/'+utils.sanitize(username)+'/downloads/'+torrent.name;
	try {
		clam.scan_dir(dir, function(err, good_files , bad_files ) {
	 		if (err) {
				console.log('Error scanning files', err);
				callback({"message":err.message,"status": 500});
			} else {
				console.log('Success scanning files');
				callback(null, {good_files: good_files, bad_files: bad_files});
			}
		});
	} catch(err) {
		console.log('Error scanning torrent', err);
		callback({"message":err.message,"status": 500});
	}
}