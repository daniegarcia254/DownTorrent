process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test'];

//Require the dev-dependencies
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../app');
let should = chai.should();
let expect = chai.expect;

chai.use(chaiHttp);

describe('Login API', () => {
	describe('Test API --> Login', () => {
		var users = [
			{name: undefined, expected: 401},
			{name: '', expected: 404},
			{name: 'invalid', expected: 401},
			{name: 'test', expected: 200},
			{name: 'root', expected: 401}
		]
		users.forEach(function(user){
			it('should return ' + user.expected + ' status for login user "' + user.name + '"', (done) => {
				chai.request(server)
					.get('/api/user/login/'+user.name)
					.end((err, res) => {
						if (user.expected !== 200) {
							expect(err).to.have.status(user.expected);
						} else {
							expect(res).to.have.status(user.expected);
						}
						done();
				});
			});
		});
	});
});
