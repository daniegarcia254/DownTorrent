process.env.NODE_ENV = 'test';

//Require the dev-dependencies
var chai = require('chai');
var expect = chai.expect;
var path = require('path');
var proc = require('child_process');
var sinon = require('sinon');
var zip = require('zipfolder');

var fsMock = require('mock-fs');

var rewire = require('rewire');
var awsS3Handler = rewire('../modules/awsS3Handler.js');
var transmission = require('../modules/transmission.js');
var utils = require('../modules/utils.js');
var s3lib = require('s3');

var AWS = require('aws-sdk-mock');
var s3client = awsS3Handler.s3client;

var EventEmitter = require('events').EventEmitter;

describe('AWS S3 Handler', () => {

	/*----------------------------------------------------*/
	// PRIVATE FUNCTIONS
	/*----------------------------------------------------*/
	describe ('Private functions', () => {

		/*----------------------------------------------------*/
		// Create zip
		/*----------------------------------------------------*/
		describe('Create ZIP', () => {
			var createZipStub;
			beforeEach(function(done){
				createZipStub = sinon.stub(zip,'zipFolder');
				done();
			});
			afterEach(function(done){
				createZipStub.restore();
				fsMock.restore();
				done();
			});
			var createZipFunc = awsS3Handler.__get__('createZip');
			it('Should not create zip if file is not a directory', function(done){
				var fakeDir = 'path/to/fake/dir/user/downloads/';
				fsMock({
					'path/to/fake/dir/user/downloads/': {
						'some-file.txt': 'file content here'
					}
				});
				createZipStub.yields(null,fakeDir+'some-file.txt');
				createZipFunc(fakeDir+'some-file.txt',fakeDir, function(err, fileName){
					expect(err).to.not.exist;
					expect(fileName).to.exist;
					expect(fileName).to.equal('some-file.txt');
					sinon.assert.notCalled(createZipStub);
					done();
				});
			});
			it('Should create zip if file is a directory', function(done){
				var fakeDir = 'path/to/fake/dir/user/downloads/mytorrent';
				fsMock({
					'path/to/fake/dir/user/downloads/mytorrent': {}
				});
				createZipStub.yields(null,fakeDir+'.zip');
				createZipFunc(fakeDir,'path/to/fake/dir/user/downloads/', function(err, fileName){
					expect(err).to.not.exist;
					expect(fileName).to.exist;
					expect(fileName).to.equal('mytorrent.zip');
					sinon.assert.calledOnce(createZipStub);
					done();
				});
			});
			it('Should return error if zipFile function fails', function(done){
				var fakeDir = 'path/to/fake/dir/user/downloads/mytorrent';
				fsMock({
					'path/to/fake/dir/user/downloads/mytorrent': {}
				});
				createZipStub.yields(new Error('Error zipFile'),null);
				createZipFunc(fakeDir,'path/to/fake/dir/user/downloads/', function(err, fileName){
					expect(err).to.exist;
					expect(fileName).to.not.exist;
					sinon.assert.calledOnce(createZipStub);
					done();
				});
			});
			it('Should return error if error occurs creating zip', function(done){
				var fakeDir = 'path/to/fake/dir/user/downloads/mytorrent';
				fsMock({
					'path/to/fake/dir/user/downloads/mytorrent': {}
				});
				createZipStub.yields(null,fakeDir+'.zip');
				createZipFunc(null,'path/to/fake/dir/user/downloads/', function(err, fileName){
					expect(err).to.exist;
					expect(fileName).to.not.exist;
					sinon.assert.notCalled(createZipStub);
					done();
				});
			});
		});

		/*----------------------------------------------------*/
		// Get content by file type
		/*----------------------------------------------------*/
		describe('Get content by file type', () => {
			var pathStub;
			beforeEach(function(done){
				pathStub = sinon.stub(path, 'extname');
				done();
			});
			afterEach(function(done){
				pathStub.restore();
				done();
			});
			var getContentTypeByFile = awsS3Handler.__get__('getContentTypeByFile');
			var files = [
				{name: 'test.html', expected: 'text/html'},
				{name: 'test.txt', expected: 'text/txt'},
				{name: 'test.css', expected: 'text/css'},
				{name: 'test.json', expected: 'application/json'},
				{name: 'test.js', expected: 'application/x-javascript'},
				{name: 'test.png', expected: 'image/png'},
				{name: 'test.jpg', expected: 'image/jpg'},
				{name: 'test.exe', expected: 'application/octet-stream'}
			];
			files.forEach(function(file){
				it('should return type "'+file.expected+'" for file "'+file.name+'"', function(done){
					pathStub.returns('.' + file.name.split('.')[1]);
					var result = getContentTypeByFile(file.name);
					expect(result).to.equal(file.expected);
					sinon.assert.calledOnce(pathStub);
					done();
				});
			});
		});

		/*----------------------------------------------------*/
		// Delete files from system
		/*----------------------------------------------------*/
		describe('Delete files from system', () => {
			var execStub, transmissionStub, client, torrentId, files;
			beforeEach(function(done){
				execStub = sinon.stub(proc, 'exec');
				transmissionStub = sinon.stub(transmission, 'delete');
				files = ['/home/user/downloads/mytorrent/','/home/user/downloads/mytorrent.zip']
				done();
			});
			afterEach(function(done){
				execStub.restore();
				transmissionStub.restore();
				done();
			});
			var deleteFiles = awsS3Handler.__get__('deleteFiles');
			it('Should delete all folders and files related to a torrent', function(done){
				execStub.yields(null,null,null);
				deleteFiles(client, torrentId, files, function(err,result){
					expect(err).to.not.exist;
					expect(result).to.not.exist;
					sinon.assert.calledTwice(execStub);
					sinon.assert.calledOnce(transmissionStub);
					done();
				});
			});
			it('Should return error if there is an error deleting files', function(done){
				execStub.yields(new Error('Error deleting files') ,null,null);
				deleteFiles(client, torrentId, files, function(err,result){
					expect(err).to.exist;
					expect(result).to.not.exist;
					sinon.assert.calledOnce(execStub);
					sinon.assert.calledOnce(transmissionStub);
					done();
				});
			});
		});

		/*----------------------------------------------------*/
		// Upload multipart file to S3 Bucket
		/*----------------------------------------------------*/
		describe('Upload file to S3 bucket', () => {
			var s3uploadStub, clientStub, callback, emitter, onErrorCallback, onProgressCallback, onEndCallback;
			var username, absoluteFilePath, fileName;
			beforeEach(function(done){
				username = 'test';
				absoluteFilePath = 'filePath';
				fileName = 'fileName';

				s3uploadStub = sinon.stub(s3client, 'uploadFile');
				clientStub = { emit: sinon.spy() };
				callback = sinon.spy();

				emitter = new EventEmitter;
				onErrorCallback = sinon.spy();
				emitter.on('error', onErrorCallback);
				onProgressCallback = sinon.spy();
				emitter.on('progress', onProgressCallback);
				onEndCallback = sinon.spy();
				emitter.on('end', onEndCallback);
				emitter.abort = sinon.spy();
				done();
			});
			afterEach(function(done){
				s3uploadStub.restore();
				done();
			});
			var uploadMultipart = awsS3Handler.__get__('uploadMultipart');
			it('Should return error if uploader not defined', function(done){
				uploadMultipart(clientStub, username, absoluteFilePath, fileName, function(err,result){
					expect(err).to.exist;
					expect(err.message).to.equal('Cannot read property \'on\' of undefined');
					expect(result).to.not.exist;
					done();
				});
			});
			it('Should return error if uploader emits an error event', function(done){
				s3uploadStub.returns(emitter);
				var err =  new Error('Test error');
				uploadMultipart(clientStub, username, absoluteFilePath, fileName, callback);
      	emitter.emit('error',err);
      	sinon.assert.calledOnce(onErrorCallback);
      	sinon.assert.calledOnce(emitter.abort);
      	sinon.assert.calledOnce(callback);
      	sinon.assert.calledWith(callback,err);
      	sinon.assert.notCalled(onProgressCallback);
      	sinon.assert.notCalled(onEndCallback);
      	sinon.assert.notCalled(clientStub.emit);
				done();
			});
			it('Client should emit progress if uploader emits a progress event', function(done){
				emitter.progressAmount = 20;
				emitter.progressTotal = 100;
				s3uploadStub.returns(emitter);
				uploadMultipart(clientStub, username, absoluteFilePath, fileName, callback);
      	emitter.emit('progress');
      	sinon.assert.calledOnce(onProgressCallback);
      	sinon.assert.notCalled(callback);
      	sinon.assert.notCalled(onErrorCallback);
      	sinon.assert.notCalled(onEndCallback);
      	sinon.assert.calledOnce(clientStub.emit);
      	sinon.assert.calledWith(clientStub.emit, 'progress', {fileName: fileName, progress: '20.00'});
				done();
			});
			it('Should return callback if uploader emits an end event', function(done){
				s3uploadStub.returns(emitter);
				uploadMultipart(clientStub, username, absoluteFilePath, fileName, callback);
      	emitter.emit('end', 'data');
      	sinon.assert.calledOnce(onEndCallback);
      	sinon.assert.notCalled(onErrorCallback);
      	sinon.assert.notCalled(onProgressCallback);
      	sinon.assert.notCalled(clientStub.emit);
      	sinon.assert.calledOnce(callback);
      	sinon.assert.calledWith(callback,null,'data');
				done();
			});
		});
	});


	/*----------------------------------------------------*/
	// MODULE FUNCTIONS
	/*----------------------------------------------------*/
	describe('Module exported functions', () => {

		/*----------------------------------------------------*/
		// Get links for S3 bucket files
		/*----------------------------------------------------*/
		describe('Get S3 bucket files information', function(){
			var username;
			beforeEach(function(done){
				username = 'test';
				done();
			});
			afterEach(function(done){
				AWS.restore('S3', 'listObjectsV2');
				process.env.S3_BUCKET = null;
				done();
			});
			it('Should return error if bucket is undefined', function(done){
				var callbackASW = sinon.spy();
				AWS.mock('S3', 'listObjectsV2', callbackASW);
				awsS3Handler.getLinks(username, function(err,data){
					expect(err).to.exist;
					expect(err).to.contain.all.keys(['code', 'message']);
					expect(err.code).to.equal('MissingRequiredParameter');
					expect(err.message).to.equal('Missing required key \'Bucket\' in params');
					sinon.assert.notCalled(callbackASW);
					done();
				});
			});
			it('Should return error if S3 \'listObjects\' returns an error', function(done){
				process.env.S3_BUCKET = 'test';
				AWS.mock('S3', 'listObjectsV2', function (params, callback) {
					callback(new Error('Test error'), null)
				});
				awsS3Handler.getLinks(username, function(err,data){
					expect(err).to.exist;
					expect(err.message).to.equal('Test error');
					done();
				});
			});
			it('Should return empty array if there are no files in the S3 bucket', function(done){
				process.env.S3_BUCKET = 'test';
				AWS.mock('S3', 'listObjectsV2', function (params, callback) {
					callback(null, {Contents:[]});
				})
				awsS3Handler.getLinks(username, function(err,data){
					expect(err).to.not.exist;
					expect(data).to.exist;
					expect(data).to.be.empty;
					done();
				});
			});
			it('Should return array with S3 bucket files information', function(done){
				process.env.S3_BUCKET = 'test';
				AWS.mock('S3', 'listObjectsV2', function (params, callback) {
					callback(null, {
						Contents:[
							{Key:'file1',Size:1024,LastModified:new Date()},
							{Key:'file2',Size:1024,LastModified:new Date()}
						]
					});
				});
				awsS3Handler.getLinks(username, function(err,data){
					expect(err).to.not.exist;
					expect(data).to.exist;
					expect(data).to.not.be.empty;
					expect(data[0]).to.contain.all.keys(['Key', 'Size', 'LastModified']);
					expect(data[0].LastModified).to.match(/^([0-9]{2}\/){2}[0-9]{4}\s-\s([0-9]{2}:){2}[0-9]{2}$/);
					done();
				});
			});
		});

		/*----------------------------------------------------*/
		// Upload file to S3 bucket
		/*----------------------------------------------------*/
		describe('Upload file to S3 bucket into a user folder', function(){
			var sanitizeStub, sanitizeURIStub, s3GetPublicUrlStub, s3GetPublicUrlStub;
			var uploadMultipartStub, deleteFilesStub;
			var client, username, torrent
			beforeEach(function(done){
				sanitizeStub = sinon.stub(utils,'sanitize');
				sanitizeURIStub = sinon.stub(utils,'sanitizeURI');
				s3GetPublicUrlStub = sinon.stub(s3lib, 'getPublicUrl');

				client = 'client';
				username = 'test';
				torrent = {id: 1, name: 'test'};
				sanitizeStub.returns(username);
				sanitizeURIStub.returns(torrent.name);

				done();
			});
			afterEach(function(done){
				AWS.restore('S3', 'headObject');
				sanitizeStub.restore();
				sanitizeURIStub.restore();
				s3GetPublicUrlStub.restore();
				process.env.S3_BUCKET = null;
				process.env.AWS_REGION = null;
				done();
			});
			it('Should return error if create zip function fails', function(done){
				process.env.S3_BUCKET = 'test';
				process.env.AWS_REGION = 'test';
				var callbackASW = sinon.spy();
				AWS.mock('S3', 'headObject', callbackASW);
				var error = new Error('Error creating zip');
				awsS3Handler.__set__('createZip', function (source, dest, cb) {
		        cb(error, null);
		    });

				awsS3Handler.upload(client, username, torrent, function(err, data){
					expect(err).to.exist;
					expect(err.message).to.equal(error.message);
					expect(data).to.not.exist;
					sinon.assert.notCalled(s3GetPublicUrlStub);
					sinon.assert.notCalled(callbackASW);
					done();
				});
			});
			describe('File already exists on S3 bucket', function(){
				it('Should return file S3 URL and delete existing files on the system', function(done){
					process.env.S3_BUCKET = 'test';
					process.env.AWS_REGION = 'test';

					awsS3Handler.__set__('createZip', function (source, dest, cb) {
			        cb(null, 'zipName');
			    });

			    s3GetPublicUrlStub.returns('zipS3Url');

			    var error = new Error('Error checking file on S3');
			    error.code = 'Server error';
					AWS.mock('S3', 'headObject', function (params, callback) {
						callback(error, null);
					});

					var deleteError = new Error('Error deleting files');
					awsS3Handler.__set__('deleteFiles', function (client, torrentId, files, deleteCb) {
			        deleteCb(deleteError, null);
			    });

					awsS3Handler.upload(client, username, torrent, function(err, data){
						expect(err).to.not.exist;
						sinon.assert.calledOnce(s3GetPublicUrlStub);
						expect(data).to.exist;
						expect(data).to.equal('zipS3Url');
						done();
					});
				});
			});
			describe('File does not exist on S3 bucket --> Upload', function(){
				it('Should return 500 error if upload fails', function(done){
					process.env.S3_BUCKET = 'test';
					process.env.AWS_REGION = 'test';

					awsS3Handler.__set__('createZip', function (source, dest, cb) {
			        cb(null, 'zipName');
			    });

			    s3GetPublicUrlStub.returns('zipS3Url');

			    var error = new Error('Error checking file on S3');
			    error.code = 'Forbidden';
					AWS.mock('S3', 'headObject', function (params, callback) {
						callback(error, null);
					});

					var uploadError = new Error('Error uploading files');
					awsS3Handler.__set__('uploadMultipart', function (client, username, absoluteFilePath, fileName, uploadCb) {
			        uploadCb(uploadError, null);
			    });

					awsS3Handler.upload(client, username, torrent, function(err, data){
						expect(err).to.exist;
						sinon.assert.calledOnce(s3GetPublicUrlStub);
						expect(data).to.not.exist;
						expect(err).to.contain.all.keys(['error']);
						expect(err.error).to.contain.all.keys(['message','status']);
						expect(err.error.message).to.equal(uploadError.message);
						expect(err.error.status).to.equal(500);
						done();
					});
				});
				it('Should return file S3 URL and delete existing files on the system', function(done){
					process.env.S3_BUCKET = 'test';
					process.env.AWS_REGION = 'test';

					awsS3Handler.__set__('createZip', function (source, dest, cb) {
			        cb(null, 'zipName');
			    });

			    s3GetPublicUrlStub.returns('zipS3Url');

			    var error = new Error('Error checking file on S3');
			    error.code = 'NotFound';
					AWS.mock('S3', 'headObject', function (params, callback) {
						callback(error, null);
					});

					awsS3Handler.__set__('uploadMultipart', function (client, username, absoluteFilePath, fileName, uploadCb) {
			        uploadCb(null, {data: 'data'});
			    });

					var deleteError = new Error('Error deleting files');
					awsS3Handler.__set__('deleteFiles', function (client, torrentId, files, deleteCb) {
			        deleteCb(deleteError, null);
			    });

					awsS3Handler.upload(client, username, torrent, function(err, data){
						expect(err).to.not.exist;
						sinon.assert.calledOnce(s3GetPublicUrlStub);
						expect(data).to.exist;
						expect(data).to.equal('zipS3Url');
						done();
					});
				});
			});
		});

		/*----------------------------------------------------*/
		// Get S3 public URL for a stored file in the bucket
		/*----------------------------------------------------*/
		describe('Get public URL for S3 file', function(){
			var username, file;
			beforeEach(function(done){
				username = 'user';
				file = 'file.txt';
				done();
			});
			afterEach(function(done){
				process.env.S3_BUCKET = null;
				process.env.AWS_REGION = null;
				done();
			});
			it('Should return invalid S3 URL if region is undefined or null', function(done){
				process.env.S3_BUCKET = 'bucket';
				var result = awsS3Handler.getFileURL(username, file);
				expect(result).to.equal('https://s3-null.amazonaws.com/bucket/user/file.txt');
				done();
			});
			it('Should return invalid S3 URL if bucket is undefined', function(done){
				process.env.AWS_REGION = 'region';
				var result = awsS3Handler.getFileURL(username, file);
				expect(result).to.equal('https://s3-region.amazonaws.com/null/user/file.txt');
				done();
			});
			it('Should return valid S3 URL if bucket and region are defined', function(done){
				process.env.S3_BUCKET = 'bucket';
				process.env.AWS_REGION = 'region';
				var result = awsS3Handler.getFileURL(username, file);
				expect(result).to.equal('https://s3-region.amazonaws.com/bucket/user/file.txt');
				done();
			});
		});

		/*----------------------------------------------------*/
		// Delete file from S3 bucket
		/*----------------------------------------------------*/
		describe('Delete file from S3 bucket', function(){
			var username,file;
			beforeEach(function(done){
				username = 'test';
				file = 'file.txt';
				done();
			});
			afterEach(function(done){
				AWS.restore('S3', 'deleteObject');
				process.env.S3_BUCKET = null;
				done();
			});
			it('Should return empty object', function(done){
				process.env.S3_BUCKET = 'test';
				AWS.mock('S3', 'deleteObject', function (params, callback) {
					callback(null,{});
				});
				awsS3Handler.deleteS3Object(username, file, function(err,data){
					expect(err).to.not.exist;
					expect(data).to.exist;
					expect(data).to.be.empty;
					done();
				});
			});
		});
	});
});
