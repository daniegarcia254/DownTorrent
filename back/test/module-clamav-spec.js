process.env.NODE_ENV = 'test';

//Require the dev-dependencies
let chai = require('chai');
let clamav = require('../modules/clamav.js');
let utils = require('../modules/utils.js');
let expect = chai.expect;
let sinon = require('sinon');


describe('ClamAV scan', () => {
	var sanitizeStub, clamScanDirStub;
	var userName, torrent;

	beforeEach(function(done){
		sanitizeStub = sinon.stub(utils,'sanitize');
		clamScanDirStub = sinon.stub(clamav.clam,'scan_dir');
		userName = 'test';
		torrent = {id:1, name:'torrent'};
		sanitizeStub.returns(userName);
		done();
	});
	afterEach(function(done){
		sanitizeStub.restore();
		clamScanDirStub.restore();
		done();
	});

	/* ------------------------------------------
	Scan files with ClamAV
	--------------------------------------------*/

	describe('Scan files', () => {
		it('should return error 500 if dir scan fails', (done) => {
			clamScanDirStub.yields(new Error('Error scanning dir'),null,null);
			clamav.scanFiles(userName,torrent, function(err,res){
				sinon.assert.calledOnce(sanitizeStub);
				sinon.assert.calledWith(sanitizeStub, userName);
				sinon.assert.calledOnce(clamScanDirStub);
				expect(err).to.exist;
				expect(res).to.not.exist;
				expect(err).to.have.status(500);
				done();
			});
		});
		it('should return result of good and bad files otherwise', (done) => {
			clamScanDirStub.yields(null,['goodFile1','goodFile2'],['badFile1','badFile2']);
			clamav.scanFiles(userName,torrent, function(err,res){
				sinon.assert.calledOnce(sanitizeStub);
				sinon.assert.calledWith(sanitizeStub, userName);
				sinon.assert.calledOnce(clamScanDirStub);
				expect(err).to.not.exist;
				expect(res).to.exist;
				expect(res).to.have.all.keys(['good_files','bad_files']);
				expect(res['good_files']).to.be.an('array');
				expect(res['bad_files']).to.be.an('array');
				done();
			});
		});
	});
});
