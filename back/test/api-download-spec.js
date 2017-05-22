process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
var chai = require('chai');
var chaiHttp = require('chai-http');
var expect = chai.expect;
chai.use(chaiHttp);

var sinon = require('sinon');
var utils = require('../modules/utils.js');
var transmission = require('../modules/transmission.js');

describe('Download API', function() {
	var server, sanitizeStub, sanitizeURIStub, checkValidUserStub, checkSpaceStub, transmissionStub;
	var userName, torrent;
	var transmissionAPIBaseURL = '/api/transmission/download';
	before(function(done){
		server = require('../app');
		done();
	});
	beforeEach(function(done){
		sanitizeStub = sinon.stub(utils,'sanitize');
		sanitizeURIStub = sinon.stub(utils,'sanitizeURI');
		checkValidUserStub = sinon.stub(utils,'checkValidUser');
		checkSpaceStub =sinon.stub(utils,'checkAvailableSpace');
		transmissionStub =sinon.stub(transmission,'addMagnet');
		userName = 'testUser';
		torrent = {id: 1, magnetLink: 'torrentMagnetLink'};
		sanitizeStub.returns(userName);
		sanitizeURIStub.returns(torrent.magnetLink);
		done();
	});
	after(function(done){
		server.close();
		done();
	});
	afterEach(function(done){
		sanitizeStub.restore();
		sanitizeURIStub.restore();
		checkValidUserStub.restore();
		checkSpaceStub.restore();
		transmissionStub.restore();
		done();
	});
	describe('Transmission torrent client', function(){
		it('should return error 401 if user is not valid', function(done) {
			checkValidUserStub.returns(false);
			chai.request(server)
				.post(transmissionAPIBaseURL)
				.send({ username: userName, torrent: torrent })
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(401);
					expect(res).to.have.status(401);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeURIStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.notCalled(checkSpaceStub);
					sinon.assert.notCalled(transmissionStub);
					done();
			});
		});
		it('should return error 403 if not space available in disk', function(done) {
			checkValidUserStub.returns(true);
			checkSpaceStub.returns(false);
			chai.request(server)
				.post(transmissionAPIBaseURL)
				.send({ username: userName, torrent: torrent })
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(403);
					expect(res).to.have.status(403);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeURIStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(checkSpaceStub);
					sinon.assert.notCalled(transmissionStub);
					done();
			});
		});
		it('should return error 500 if transmission fails on adding magnet link to download', function(done) {
			checkValidUserStub.returns(true);
			checkSpaceStub.returns(true);
			transmissionStub.yields(new Error('Error adding magnet link', null));
			chai.request(server)
				.post(transmissionAPIBaseURL)
				.send({ username: userName, torrent: torrent })
				.end((err, res) => {
					expect(err).to.exist;
					expect(res).to.exist;
					expect(err).to.have.status(500);
					expect(res).to.have.status(500);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeURIStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(checkSpaceStub);
					sinon.assert.calledOnce(transmissionStub);
					sinon.assert.calledWith(transmissionStub, torrent.magnetLink);
					done();
			});
		});
		it('should return error 200 if transmission success on adding magnet link to download', function(done) {
			checkValidUserStub.returns(true);
			checkSpaceStub.returns(true);
			transmissionStub.yields(null, 'Added correctly');
			chai.request(server)
				.post(transmissionAPIBaseURL)
				.send({ username: userName, torrent: torrent })
				.end((err, res) => {
					expect(err).to.not.exist;
					expect(res).to.exist;
					expect(res).to.have.status(200);
					sinon.assert.calledOnce(sanitizeStub);
					sinon.assert.calledOnce(sanitizeURIStub);
					sinon.assert.calledOnce(checkValidUserStub);
					sinon.assert.calledOnce(checkSpaceStub);
					sinon.assert.calledOnce(transmissionStub);
					sinon.assert.calledWith(transmissionStub, torrent.magnetLink);
					done();
			});
		});
	});
});
