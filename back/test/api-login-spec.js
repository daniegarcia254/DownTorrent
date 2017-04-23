process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

describe('/user/login/:username', function() {
	var server;
	before(function(){
		server = require('../app');
	});
	after(function(done){
		server = server.close();
		done();
	});
	var users = [
		{name: undefined, expected: 401},
		{name: '', expected: 404},
		{name: 'invalid', expected: 401},
		{name: 'root', expected: 401},
		{name: 'test', expected: [200,500]},
		{name: 'test2', expected: [200,500]}
	]
	users.forEach(function(user){
		it('should return ' + user.expected + ' status for user "' + user.name + '"', function(done) {
			this.timeout(10000);
			chai.request(server)
				.get('/api/user/login/'+user.name)
				.end((err, res) => {
					console.log("STATUS", res.status);
					if (user.name==='test' || user.name==='test2') {
						expect(res.status).to.be.oneOf(user.expected);
					} else {
						expect(err).to.have.status(user.expected);
					}
					done();
			});
		});
	});
});
