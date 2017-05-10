process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
chai.use(chaiHttp);

let sinon = require('sinon');
let utils = require('../modules/utils.js');
let awsS3 = require('../modules/awsS3Handler.js');

describe('Links/Files API', function() {
	var server, sanitizeStub, checkValidUserStub, awsS3GetLinksStub;
	var userName, key;
	var linkAPIBase_URI = '/api/links/';
	before(function(done){
		server = require('../app');
		done();
	});
	beforeEach(function(done){
		sanitizeStub = sinon.stub(utils,'sanitize');
		checkValidUserStub = sinon.stub(utils,'checkValidUser');
		awsS3GetLinksStub = sinon.stub(awsS3,'getLinks');
		awsS3GetURLStub = sinon.stub(awsS3,'getFileURL');
		awsS3DeleteFileStub = sinon.stub(awsS3,'deleteS3Object');
		userName = 'testUser';
		key = 'fileKey';
		sanitizeStub.returns(userName);
		done();
	});
	after(function(done){
		server = server.close();
		done();
	});
	afterEach(function(done){
		sanitizeStub.restore();
		checkValidUserStub.restore();
		awsS3GetLinksStub.restore();
		awsS3GetURLStub.restore();
		awsS3DeleteFileStub.restore();
		done();
	});

	/* ------------------------------------------
	Get S3 bucket user links
	--------------------------------------------*/
	describe('Get links', function(){
		it('should return error 401 if user is not valid', function(done) {
			checkValidUserStub.returns(false);
			chai.request(server)
				.get(linkAPIBase_URI + userName)
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(401);
					expect(res).to.have.status(401);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.notCalled(awsS3GetLinksStub);
					done();
			});
		});
		it('should return error 500 if getLinks function returns an error', function(done) {
			checkValidUserStub.returns(true);
			awsS3GetLinksStub.yields(new Error('Error getting links'))
			chai.request(server)
				.get(linkAPIBase_URI + userName)
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(500);
					expect(res).to.have.status(500);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(awsS3GetLinksStub);
					sinon.assert.calledWith(awsS3GetLinksStub, userName);
					done();
			});
		});
		it('should return 200 OK otherwise', function(done) {
			checkValidUserStub.returns(true);
			awsS3GetLinksStub.yields(null, [{"id":1,"name":"link1"},{"id":2,"name":"link2"}]);
			chai.request(server)
				.get(linkAPIBase_URI + userName)
				.end((err, res) => {
					expect(err).to.not.exist;
					expect(res).to.exist;
					expect(res).to.have.status(200);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(awsS3GetLinksStub);
					sinon.assert.calledWith(awsS3GetLinksStub, userName);
					done();
			});
		});
	});

	/* ------------------------------------------
	Get S3 file URL
	--------------------------------------------*/

	describe('Get S3 file URL', function(){
		it('should return error 401 if user is not valid', function(done) {
			checkValidUserStub.returns(false);
			chai.request(server)
				.get(linkAPIBase_URI + userName + '/' + key)
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(401);
					expect(res).to.have.status(401);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.notCalled(awsS3GetURLStub);
					done();
			});
		});
		it('should return 200 OK otherwise', function(done) {
			checkValidUserStub.returns(true);
			awsS3GetURLStub.returns();
			chai.request(server)
				.get(linkAPIBase_URI + userName + '/' + key)
				.end((err, res) => {
					expect(err).to.not.exist;
					expect(res).to.exist;
					expect(res).to.have.status(200);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(awsS3GetURLStub);
					sinon.assert.calledWith(awsS3GetURLStub, userName, key);
					done();
			});
		});
	});

	/* ------------------------------------------
	Delete S3 file
	--------------------------------------------*/

	describe('Delete S3 file', function(){
		it('should return error 401 if user is not valid', function(done) {
			checkValidUserStub.returns(false);
			chai.request(server)
				.del(linkAPIBase_URI + userName + '/' + key)
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(401);
					expect(res).to.have.status(401);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.notCalled(awsS3DeleteFileStub);
					done();
			});
		});
		it('should return error 500 if getLinks function returns an error', function(done) {
			checkValidUserStub.returns(true);
			awsS3DeleteFileStub.yields(new Error('Error deleting file from S3'))
			chai.request(server)
				.del(linkAPIBase_URI + userName + '/' + key)
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(500);
					expect(res).to.have.status(500);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(awsS3DeleteFileStub);
					sinon.assert.calledWith(awsS3DeleteFileStub, userName, key);
					done();
			});
		});
		it('should return 200 OK otherwise', function(done) {
			checkValidUserStub.returns(true);
			awsS3DeleteFileStub.yields(null, null);
			chai.request(server)
				.del(linkAPIBase_URI + userName + '/' + key)
				.end((err, res) => {
					expect(err).to.not.exist;
					expect(res).to.exist;
					expect(res).to.have.status(200);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(awsS3DeleteFileStub);
					sinon.assert.calledWith(awsS3DeleteFileStub, userName, key);
					done();
			});
		});
	});
});
