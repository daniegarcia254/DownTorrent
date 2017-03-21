'use strict'

const fs = require('fs')
const path = require('path')
const spawn = require('child_process').spawnSync
const s3lib = require('s3')
const AWS = require('aws-sdk')
const utils = require('./utils.js')()
const zipFolder = require('zip-folder')
const async = require('async')
const rimraf = require('rimraf')
const prettyBytes = require('pretty-bytes')
const _ = require('underscore')
const moment = require('moment')
const transmission = require('./transmission.js')()
const deluge = require('./deluge.js')()

// Create S3 AWS-SDK client
const s3aws = new AWS.S3();

// Create S3 lib client
const s3client = s3lib.createClient({
	maxAsyncS3: 20,			// this is the default
	s3RetryCount: 3,		// this is the default
	s3RetryDelay: 1000,	// this is the default
	multipartUploadThreshold: 20971520,	// this is the default (20 MB)
	multipartUploadSize: 15728640,			// this is the default (15 MB)
	s3Options: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
		region: process.env.AWS_REGION,
		// endpoint: 's3.yourdomain.com',
		// sslEnabled: false
		// any other options are passed to new AWS.S3()
		// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
	},
});

module.exports = function() {
	var module = {};

	module.upload = function(client, torrentClient, username, torrent, callback){
		console.log("Upload files", utils.sanitize(username), utils.sanitizeURI(torrent.name));

		try {
			var fileName = '/home/'+utils.sanitize(username)+'/downloads/'+utils.sanitizeURI(torrent.name),
			baseDir = '/home/'+utils.sanitize(username)+'/downloads/';

			// Create zip
			createZip(fileName, baseDir, function(err, zipName) {
				if (err){
					console.log("Error creating zip", err);
					callback(err)
				}
				else {
					console.log('Success creating zip', zipName);
					var url = s3lib.getPublicUrl(process.env.S3_BUCKET,zipName,process.env.AWS_REGION);
					// First, check if file already exists in S3
					var params = { Bucket: process.env.S3_BUCKET, Key: zipName };
					s3aws.headObject(params, function (err, metadata) {
						console.log("Check if file exists", url, err, metadata);
						if (err && (err.code === 'NotFound' || err.code === 'Forbidden')) {
							// If it doesn't exists --> Upload
							uploadFile(client, baseDir+zipName, function(err, data){
								if (err) {
									console.log("Error uploading zip file", err);
									callback({"message":err.message,"status": 500});
								}
								else {
									deleteFiles(client, torrentClient, torrent.id, [baseDir+zipName, fileName], function(err, result){
										if (err) console.log("Error deleting zip and torrent files", err);
										callback(null, url);
									});
								}
							});
						} else {
							deleteFiles(client, torrentClient, torrent.id, [baseDir+zipName, fileName], function(err, result){
								if (err) console.log("Error deleting zip and torrent files", err);
								callback(null, url);
							});
						}
					});
				}
			});
		} catch(err) {
			console.log("Error uploading files", err);
			callback({"message":err.message,"status": 500});
		}
	}

	module.getLinks = function(username, callback){
		s3aws.listObjects({Bucket: process.env.S3_BUCKET}, function(err, data) {
			if (err) callback(err)
			else  {
				var files = [];
				if(data.Contents.length > 0){
					_.each(data.Contents, function(f){
						var file = {};
						file.LastModified = moment(f.LastModified).format('DD/MM/YYYY - HH:mm:ss')
						file.Size = prettyBytes(f.Size)
						file.Key = f.Key
						files.push(file)
					});
				}
				callback(null, files);
			}
		});
	}

	module.getFileURL = function(username, file, callback){
		console.log("getFileURL", process.env.S3_BUCKET, file, process.env.AWS_REGION);
		return s3lib.getPublicUrl(process.env.S3_BUCKET, file, process.env.AWS_REGION);
	}

	/*----------------------------------------------------*/
	// Auxiliary functions
	/*----------------------------------------------------*/

	function createZip(fileName, zipDir, callback){
		console.log("Create zip", fileName, zipDir)

		var fsStats = fs.statSync(fileName),
			zipName,
			dir;

		if (fsStats.isDirectory()){
			zipName = zipDir + path.basename(fileName) + '.zip';
			zipFolder(fileName, zipName , function(err) {
				if (err) callback({"error": err})
				else callback(null, path.basename(zipName))
			});
		} else {
			console.log("Don't create zip for file", path.basename(fileName))
			callback(null, path.basename(fileName))
		}
	}

	function uploadFile(client, absoluteFilePath, uploadCb) {
		var fileName = path.basename(absoluteFilePath),
		stats = fs.statSync(absoluteFilePath),
		fileSizeInBytes = stats["size"];

		uploadMultipart(client, absoluteFilePath, fileName, uploadCb)
	}

	function uploadMultipart(client, absoluteFilePath, fileName, uploadCb) {
		var params = {
			localFile: absoluteFilePath,
			s3Params: {
				Bucket: process.env.S3_BUCKET,
				Key: fileName,
				ACL: 'public-read',
				ContentType: getContentTypeByFile(fileName)
					// other options supported by putObject, except Body and ContentLength.
					// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
			}
		};
		var uploader = s3client.uploadFile(params);
		uploader.on('error', function(err) {
			console.error("s3client[error upload]: ", err.stack);
			uploader.abort();
			uploadCb(err);
		});
		uploader.on('progress', function() {
			//console.log("s3client[upload progress]: ", parseFloat((uploader.progressAmount/uploader.progressTotal)*100).toFixed(2))
			var progress = parseFloat((uploader.progressAmount/uploader.progressTotal)*100).toFixed(2)
			client.emit('progress', {fileName: fileName, progress:progress});
		});
		uploader.on('end', function(data) {
			console.log("s3client[finish upload]: ", data);
			uploadCb(null,data);
		});
	}

	function getContentTypeByFile(fileName) {
		var rc = 'application/octet-stream',
		fn = fileName.toLowerCase();

		if (fn.indexOf('.html') >= 0) rc = 'text/html';
		else if (fn.indexOf('.css') >= 0) rc = 'text/css';
		else if (fn.indexOf('.json') >= 0) rc = 'application/json';
		else if (fn.indexOf('.js') >= 0) rc = 'application/x-javascript';
		else if (fn.indexOf('.png') >= 0) rc = 'image/png';
		else if (fn.indexOf('.jpg') >= 0) rc = 'image/jpg';

		return rc;
	}

	function deleteFiles(client, torrentClient, torrentId, files, deleteCb){
		console.log("Deleting files", files);
		async.forEach(files, function(file, cb){
			rimraf(file, cb);
		}, function(err){
			switch(torrentClient){
				case 'transmission': transmission.delete(client,torrentId,true); break;
				case 'deluge': deluge.delete(client,torrentId,true); break;
				default: transmission.delete(client,torrentId,true); break;
			}
			deleteCb(err);
		});
	}

	return module;
}