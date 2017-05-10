process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let expect = chai.expect;
let nock = require('nock');

chai.use(chaiHttp);

describe('Search API', function() {
	var server;
	before(function(){
		server = require('../app');
	});
	after(function(done){
		server = server.close();
		nock.restore();
		done();
	});
	describe('The Pirate Bay search', function() {
		it('should get a result search with at least 0 elements for a valid search', function(done) {

			nock('https://thepiratebay.org').filteringPath(function(path){ return '/';}).get('/').reply(200, '');
			nock('https://thepiratebay.se').filteringPath(function(path){ return '/';}).get('/').reply(200, '');
			nock('https://thepiratebay.one').filteringPath(function(path){ return '/';}).get('/').reply(200, '');
			nock('https://ahoy.one').filteringPath(function(path){ return '/';}).get('/').reply(200, '');

			chai.request(server)
				.get('/api/search/piratebay')
				.query({q:'test'})
				.end((err, res, body) => {
					expect(err).to.not.exist;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					res.body.should.be.a('array');
					done();
				});
		});
		it('should return empty array ThePirateBay page returns error',function(done) {

			//Can't test error functionality until returned promise is correctly handled by the library
			this.skip();

			nock('https://thepiratebay.org').filteringPath(function(path){ return '/';}).get('/').reply(502, '502: Bad gateway');
			nock('https://thepiratebay.se').filteringPath(function(path){ return '/';}).get('/').reply(502, '502: Bad gateway');
			nock('https://thepiratebay.one').filteringPath(function(path){ return '/';}).get('/').reply(502, '502: Bad gateway');
			nock('https://ahoy.one').filteringPath(function(path){ return '/';}).get('/').reply(502, '502: Bad gateway');

			chai.request(server)
				.get('/api/search/piratebay')
				.query({q:'test'})
				.end((err, res, body) => {
					expect(err).to.not.exist;
					expect(res).to.have.status(200);
					expect(res).to.be.json;
					res.body.should.be.a('array');
					res.body.length.should.be.least(0);
					done();
				});
		});
	});
});
