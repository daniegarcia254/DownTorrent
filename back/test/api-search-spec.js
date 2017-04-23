process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

describe('Search API', function() {
	var server;
	before(function(done){
		server = require('../app');
		done();
	});
	after(function(done){
		server = server.close();
		done();
	});
	var searches = [
		{value: undefined, status: 200, total: 0},
		{value: '', status: 200, total: 0},
		{value: 'Oxford', status: 200, total: 0}
	]
	describe('The Pirate Bay search', function() {
		searches.forEach(function(search){
			it('should get a result search with at least 0 elements for search "'+ search.value+'"', function(done) {
			this.timeout(10000);
			chai.request(server)
				.get('/api/search/piratebay')
				.query({q:search.value})
				.end((err, res) => {
					if (err) {
						return done(err);
					}
					expect(res).to.have.status(search.status);
					expect(res).to.be.json;
					res.body.should.be.a('array');
					res.body.length.should.be.least(search.total);
					done();
				});
			});
		});
	});
});
