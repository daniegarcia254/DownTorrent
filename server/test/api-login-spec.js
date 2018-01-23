process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let sinon = require('sinon');
let utils = require('../modules/utils.js');
let proc = require('child_process');
let chai = require('chai');
let chaiHttp = require('chai-http');
let expect = chai.expect;
chai.use(chaiHttp);

describe('Login API', function() {
	var server, sanitizeStub, checkUserStub, handleSpawnErrorStub, spawnSyncStub;
	var loginAPIBaseURL = '/api/user/login/';
	var userName = 'test';
	var spawnObjectError = {error: 'Error spawn'};
	var spawnObjectSuccess = {stdout: 'User exists'};
	before(function(done){
		server = require('../app');
		done();
	});
	beforeEach(function(done){
		sanitizeStub = sinon.stub(utils,'sanitize');
		checkUserStub = sinon.stub(utils,'checkValidUser');
		handleSpawnErrorStub = sinon.stub(utils,'handleSpawnError');
		spawnSyncStub = sinon.stub(proc, 'spawnSync');
		sanitizeStub.returns(userName);
		done();
	});
	after(function(done){
		server.close();
		done();
	});
	afterEach(function(done){
		sanitizeStub.restore();
		checkUserStub.restore();
		handleSpawnErrorStub.restore();
		spawnSyncStub.restore();
		done();
	});

	/* ------------------------------------------
	Login function
	--------------------------------------------*/
  it('should return error 401 if user is not valid', function(done) {
		checkUserStub.returns(false);
		chai.request(server)
			.get(loginAPIBaseURL + userName)
			.end((err, res) => {
				expect(err).to.exist;
				expect(res).to.exist;
				expect(err).to.have.status(401);
				expect(res).to.have.status(401);
				sinon.assert.calledOnce(sanitizeStub);
				sinon.assert.calledWith(sanitizeStub,userName);
				sinon.assert.calledOnce(checkUserStub);
				sinon.assert.calledWith(checkUserStub,userName);
				sinon.assert.notCalled(handleSpawnErrorStub);
				sinon.assert.notCalled(spawnSyncStub);
				done();
		});
	});
	it('should return error 500 if error checking user against system', function(done) {
		checkUserStub.returns(true);
		spawnSyncStub.returns(spawnObjectError);
		handleSpawnErrorStub.returns(new Error('Error checking user'));
		chai.request(server)
			.get(loginAPIBaseURL + userName)
			.end((err, res) => {
				expect(err).to.exist;
				expect(res).to.exist;
				expect(err).to.have.status(500);
				expect(res).to.have.status(500);
				sinon.assert.calledOnce(sanitizeStub);
				sinon.assert.calledWith(sanitizeStub,userName);
				sinon.assert.calledOnce(checkUserStub);
				sinon.assert.calledWith(checkUserStub,userName);
				sinon.assert.calledOnce(spawnSyncStub);
				sinon.assert.calledWith(spawnSyncStub,'id',[userName]);
				sinon.assert.calledOnce(handleSpawnErrorStub);
				sinon.assert.calledWith(handleSpawnErrorStub, spawnObjectError);
				done();
		});
	});
	it('should return 200 OK otherwise', function(done) {
		checkUserStub.returns(true);
		spawnSyncStub.returns(spawnObjectSuccess);
		handleSpawnErrorStub.returns(null);
		chai.request(server)
			.get(loginAPIBaseURL + userName)
			.end((err, res) => {
				expect(err).to.not.exist;
				expect(res).to.exist;
				expect(res).to.have.status(200);
				sinon.assert.calledOnce(sanitizeStub);
				sinon.assert.calledWith(sanitizeStub,userName);
				sinon.assert.calledOnce(checkUserStub);
				sinon.assert.calledWith(checkUserStub,userName);
				sinon.assert.calledOnce(spawnSyncStub);
				sinon.assert.calledWith(spawnSyncStub,'id',[userName]);
				sinon.assert.calledOnce(handleSpawnErrorStub);
				sinon.assert.calledWith(handleSpawnErrorStub, spawnObjectSuccess);
				done();
		});
	});
});
