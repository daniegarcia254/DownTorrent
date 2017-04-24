process.env.NODE_ENV = 'test';

//Require the dev-dependencies
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var path = require('path');
var proc = require('child_process');
var sinon = require('sinon');
var zip = require('zipfolder');
var async = require('async');

var fsMock = require('mock-fs');

var rewire = require('rewire');
var awsS3Handler = rewire('../modules/awsS3Handler.js');
var transmission = require('../modules/transmission.js');
var deluge = require('../modules/deluge.js');

var AWS = require('aws-sdk-mock');
var s3lib = require('s3');

describe('AWS S3 Handler', () => {

	/*----------------------------------------------------*/
	// Private functions
	/*----------------------------------------------------*/
	describe ('Private functions', () => {
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
		});
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
		describe('Delete files from system once uploaded to S3 bucket', () => {
			var execStub, transmissionStub, delugeStub, client, torrentClient, torrentId, files;
			beforeEach(function(done){
				execStub = sinon.stub(proc, 'exec');
				transmissionStub = sinon.stub(transmission, 'delete');
				delugeStub = sinon.stub(deluge, 'delete');
				files = ['/home/user/downloads/mytorrent/','/home/user/downloads/mytorrent.zip']
				done();
			});
			afterEach(function(done){
				execStub.restore();
				transmissionStub.restore();
				delugeStub.restore();
				done();
			});
			var deleteFiles = awsS3Handler.__get__('deleteFiles');
			['transmission','deluge','default'].forEach(function(torrentClient){
				it('Should delete all folders and files related to a torrent', function(done){
					execStub.yields(null,null,null);
					deleteFiles(client, torrentClient, torrentId, files, function(err,result){
						expect(err).to.not.exist;
						expect(result).to.not.exist;
						sinon.assert.calledTwice(execStub);
						if (torrentClient === 'deluge'){
							sinon.assert.calledOnce(delugeStub);
						} else {
							sinon.assert.calledOnce(transmissionStub);
						}
						done();
					});
				});
			});
			it('Should return error in callback if there is an error deleting files', function(done){
				execStub.yields(new Error('Error deleting files') ,null,null);
				deleteFiles(client, torrentClient, torrentId, files, function(err,result){
					expect(err).to.exist;
					expect(result).to.not.exist;
					sinon.assert.calledOnce(execStub);
					sinon.assert.notCalled(delugeStub);
					sinon.assert.calledOnce(transmissionStub);
					done();
				});
			});
		});
	});

	/*----------------------------------------------------*/
	// Module functions
	/*----------------------------------------------------*/
	describe('Module exported functions', () => {
		describe('Get S3 bucket files information', function(){
			var username;
			beforeEach(function(done){
				username = 'test';
				done();
			});
			afterEach(function(done){
				AWS.restore('S3', 'listObjectsV2')
				process.env.S3_BUCKET = null;
				done();
			});
			it('Should return error if bucket is undefined', function(done){
				var callbackASW = sinon.spy();
				AWS.mock('S3', 'listObjectsV2', callbackASW)
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
				})
				awsS3Handler.getLinks(username, function(err,data){
					expect(err).to.exist;
					expect(err.message).to.equal('Test error');
					done();
				});
			});
			it('Should return empty array if there are no files in the S3 bucket', function(done){
				process.env.S3_BUCKET = 'test';
				AWS.mock('S3', 'listObjectsV2', function (params, callback) {
					callback(null, {Contents:[]})
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
				})
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
			it('Should return invalid S3 URL if region is undefined', function(done){
				process.env.S3_BUCKET = 'bucket';
				var result = awsS3Handler.getFileURL(username, file);
				expect(result).to.equal('https://s3.amazonaws.com/bucket/user/file.txt');
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
		describe('Delete file from S3 bucket', function(){
			var username,file;
			beforeEach(function(done){
				username = 'test';
				file = 'file.txt';
				done();
			});
			afterEach(function(done){
				AWS.restore('S3', 'deleteObject')
				process.env.S3_BUCKET = null;
				done();
			});
			it('Should return empty object', function(done){
				process.env.S3_BUCKET = 'test';
				var callbackASW = sinon.spy();
				AWS.mock('S3', 'deleteObject', function (params, callback) {
					callback(null,{});
				})
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
