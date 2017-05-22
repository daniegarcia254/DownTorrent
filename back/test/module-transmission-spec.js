process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;

//Require the dev-dependencies
var utils = require('../modules/utils.js');
var rewire = require('rewire');
var transmission = rewire('../modules/transmission.js');
var transmissionClient = transmission.transmission;

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');

describe('Transmission torrent client module', () => {
	var app, getStatusTypeFunc;
	var clientStub, transmissionStub;
	var statusType, info, userName, torrent, magnetLink, dir, id;
	var statusArray = ['Paused','Checking','Checked','Waiting','Downloading','Seeding','Completed','Isolated',''];

	/* ------------------------------------------
	PRIVATE FUNCTIONS
	--------------------------------------------*/
	describe('Private functions', () =>{
		/* ------------------------------------------
		Get string status from int type
		--------------------------------------------*/
		describe('Get status', () => {
			it('should return correct string status for a given integer status', function(done){
				getStatusTypeFunc = transmission.__get__('getStatusType');
				statusArray.forEach(function(type,idx){
					statusType = getStatusTypeFunc(idx);
					expect(statusType).to.equal(type);
				});
				done();
			});
		});
	});

	/* ------------------------------------------
	MODULE FUNCTIONS
	--------------------------------------------*/
	describe('Module functions', () => {
		describe('Private functions', () =>{
			/* ------------------------------------------
			Get string status from int type
			--------------------------------------------*/
			describe('Get status', () => {
				it('should return correct string status for a given integer status', function(done){
					getStatusTypeFunc = transmission.__get__('getStatusType');
					statusArray.forEach(function(type,idx){
						statusType = getStatusTypeFunc(idx);
						expect(statusType).to.equal(type);
					});
					done();
				});
			});
		});

		/* ------------------------------------------
		Get info
		--------------------------------------------*/
		describe('Get info about current torrents', () => {
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'get');
				clientStub = { emit: sinon.spy() };
				info ={ torrents: [
						{
							id: 1, name: 'Torrent 1', totalSize: 0,
							isFinished: false, status: 0,
							percentDone: 0.5, rateDownload: 250,
							magnetLink: 'magnet', eta: 100
						},
						{
							id: 2, name: 'Torrent 2', totalSize: 24000,
							isFinished: true, status: 0,
							percentDone: 0.5, rateDownload: 250,
							magnetLink: 'magnet', eta: -2
						},
						{
							id: 3, name: 'Torrent 3', totalSize: 24000,
							isFinished: false, status: 0,
							percentDone: 0.5, rateDownload: 250,
							magnetLink: 'magnet', eta: 100
						}
					]};
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should emit error 500 if an error occurs getting torrents', function(done){
				var err = new Error('Transmission torrent client error');
				transmissionStub.yields(err, null);
				transmission.getInfo(clientStub);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(clientStub.emit,'info', {'error': {'message':err.message,'status': 500}});
		    done();
			});
			it('should emit error 500 if an error occurs processing torrents', function(done){
				info = {};
				var errorMsg = 'Cannot read property \'length\' of undefined';
				transmissionStub.yields(null, info);
				transmission.getInfo(clientStub);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(clientStub.emit,'info', {'error': {'message':errorMsg,'status': 500}});
		    done();
			});
			it('should return list of torrents otherwise', function(done){
				var result =[{
						id: 1, name: 'Torrent 1', size: '-', status: 'Checking', progress: 50,
						speed: '-', magnetLink: 'magnet', eta: '1m 40s'
					},{
						id: 2, name: 'Torrent 2', size: '24 kB', status: 'Completed', progress: 50,
						speed: '250 B/s', magnetLink: 'magnet', eta: '-'
					},{
						id: 3, name: 'Torrent 3', size: '24 kB', status: 'Paused', progress: 50,
						speed: '250 B/s', magnetLink: 'magnet', eta: '1m 40s'
					}];
				transmissionStub.yields(null, info);
				transmission.getInfo(clientStub);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(clientStub.emit,'info', result);
		    done();
			});
		});

		/* ------------------------------------------
		Add torrent
		--------------------------------------------*/
		describe('Add torrent', () => {
			before(function(done){
				magnetLink = 'magnetLink';
				dir = 'dir';
				done();
			});
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'addUrl');
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should return error if an error occurs adding torrent', function(done){
				transmissionStub.yields(new Error('Transmission torrent client error'), null);
				transmission.addMagnet(magnetLink, dir, function(err, result){
					sinon.assert.calledOnce(transmissionStub);
					sinon.assert.calledWith(transmissionStub, magnetLink, {'download-dir': dir});
					expect(err).to.exist;
					expect(result).to.not.exist;
					done();
				});
			});
			it('should return added torrent info otherwise', function(done){
				transmissionStub.yields(null, {info: 'torrent'});
				transmission.addMagnet(magnetLink, dir, function(err, result){
					sinon.assert.calledOnce(transmissionStub);
					sinon.assert.calledWith(transmissionStub, magnetLink, {'download-dir': dir});
					expect(err).to.not.exist;
					expect(result).to.exist;
					done();
				});
			});
		});

		/* ------------------------------------------
		Pause torrent
		--------------------------------------------*/
		describe('Pause torrent', () => {
			before(function(done){
				id = 1;
				done();
			});
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'stop');
				clientStub = { emit: sinon.spy() };
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should emit an error if an error occurs pausing torrent', function(done){
				var err = new Error('Transmission torrent client error');
				transmissionStub.yields(err, null);
				transmission.pause(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'pause', {'error': {'message':err.message,'status': 500}});
		    done();
			});
			it('should emit torrent id otherwise', function(done){
				transmissionStub.yields(null, id);
				transmission.pause(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'pause', id);
		    done();
			});
		});

		/* ------------------------------------------
		Resume torrent
		--------------------------------------------*/
		describe('Resume torrent', () => {
			before(function(done){
				id = 1;
				done();
			});
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'start');
				clientStub = { emit: sinon.spy() };
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should emit an error if an error occurs resuming torrent', function(done){
				var err = new Error('Transmission torrent client error');
				transmissionStub.yields(err, null);
				transmission.resume(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'resume', {'error': {'message':err.message,'status': 500}});
		    done();
			});
			it('should emit torrent id otherwise', function(done){
				transmissionStub.yields(null, id);
				transmission.resume(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'resume', id);
		    done();
			});
		});

		/* ------------------------------------------
		Remove torrent and data torrent
		--------------------------------------------*/
		describe('Delete torrent and data', () => {
			before(function(done){
				id = 1;
				done();
			});
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'remove');
				clientStub = { emit: sinon.spy() };
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should emit an error if an error occurs deleting torrent', function(done){
				var err = new Error('Transmission torrent client error');
				transmissionStub.yields(err, null);
				transmission.delete(clientStub, id, true);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'delete', {'error': {'message':err.message,'status': 500}});
		    done();
			});
			it('should emit torrent id otherwise', function(done){
				transmissionStub.yields(null, id);
				transmission.delete(clientStub, id, true);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id, true);
				sinon.assert.calledWith(clientStub.emit,'delete', id);
		    done();
			});
		});

		/* ------------------------------------------
		Remove only torrent
		--------------------------------------------*/
		describe('Delete only torrent', () => {
			before(function(done){
				id = 1;
				done();
			});
			beforeEach(function(done){
				transmissionStub = sinon.stub(transmissionClient,'remove');
				clientStub = { emit: sinon.spy() };
				done();
			});
			afterEach(function(done){
				transmissionStub.restore();
				done();
			});
			it('should emit an error if an error occurs deleting torrent', function(done){
				var err = new Error('Transmission torrent client error');
				transmissionStub.yields(err, null);
				transmission.delete(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'delete', {'error': {'message':err.message,'status': 500}});
		    done();
			});
			it('should emit torrent id otherwise', function(done){
				transmissionStub.yields(null, id);
				transmission.delete(clientStub, id);
				sinon.assert.calledOnce(transmissionStub);
				sinon.assert.calledOnce(clientStub.emit);
				sinon.assert.calledWith(transmissionStub, id);
				sinon.assert.calledWith(clientStub.emit,'delete', id);
		    done();
			});
		});
	});
});