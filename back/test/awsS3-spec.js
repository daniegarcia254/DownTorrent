process.env.NODE_ENV = 'test';

//Require the dev-dependencies
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;
var path = require('path');
var sinon = require('sinon');

var rewire = require('rewire'),
		awsS3Handler = rewire('../modules/awsS3Handler.js');

var AWS = require('aws-sdk-mock');
var s3lib = require('s3');

describe('Uploader', () => {
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
			{name: 'test.txt', expected: 'text/html'},
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
	describe('Get S3 bucket files information', function(){
		var username;
		beforeEach(function(done){
			username = 'test';
			done();
		});
		afterEach(function(done){
			AWS.restore('S3', 'listObjects')
			process.env.S3_BUCKET = null;
			done();
		});
		it('Should return error if bucket is undefined', function(done){
			var callbackASW = sinon.spy();
			AWS.mock('S3', 'listObjects', callbackASW)
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
			AWS.mock('S3', 'listObjects', function (params, callback) {
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
			AWS.mock('S3', 'listObjects', function (params, callback) {
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
			AWS.mock('S3', 'listObjects', function (params, callback) {
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
