process.env.NODE_ENV = 'test';
process.env.APP_PORT = 10000;
process.env.VALID_USERS = ['test','test2'];

//Require the dev-dependencies
let chai = require('chai');
let utils = require('../modules/utils.js');
let should = chai.should();
let expect = chai.expect;

describe('Utils', () => {
	describe('Sanitize', () => {
		describe('Sanitize', () => {
			var strings = [
				'adduser test; rm -Rf / | test',
				'adduser test; [cat /etc/password >> fake@host]',
			];
			it('should return a clean string without special chars', (done) => {
				strings.forEach(function(str){
					var result = utils.sanitize(str);
					expect(result).to.not.contain('[');
					expect(result).to.not.contain(']');
					expect(result).to.not.contain('>');
					expect(result).to.not.contain('<');
					expect(result).to.not.contain(';');
					expect(result).to.not.contain('&');
					expect(result).to.not.contain('|');
					expect(result).to.not.contain('/');
				});
				done();
			});
		});
		describe('Sanitize URI', () => {
			var uris = [
				'www.my[invalid]url.com',
				'mydomain<.com/inde>x.html&q=test',
				'www.my;invalid|url.c/om'
			];
			it('should return a clean URI without special chars', (done) => {
				uris.forEach(function(uri){
					var result = utils.sanitize(uri);
					expect(result).to.not.contain('[');
					expect(result).to.not.contain(']');
					expect(result).to.not.contain('>');
					expect(result).to.not.contain('<');
					expect(result).to.not.contain(';');
					expect(result).to.not.contain('|');
					expect(result).to.not.contain('/');
				});
				done();
			});
		});
	});
	describe('Validate user', () => {
		var users = [undefined,'','root','myuser','test'];
		it('should return true for valid users and false for invalid users', (done) => {
			users.forEach(function(user){
				var result = utils.checkValidUser(user);
				if (user !== 'test') {
					expect(result).to.be.false;
				} else {
					expect(result).to.be.true;
				}
			});
			done();
		});
	});
	describe('Check available space', () => {
		it('should return true or false', (done) => {
			var result = utils.checkAvailableSpace();
			expect(result).to.be.oneOf([true,false]);
			done();
		});
	});
	describe('Handle spawn error', () => {
		it('should return {message,status} error object if error is a valid error object or null otherwise', (done) => {
			var errors = [
				{errObject: {error: {message:'Message',errno: 500}}, expected: {message:'Message', status: 500}},
				{errObject: {stderr: 'Some error'}, expected: {message:'Some error', status: 500}},
				{errObject: {stderr: '', stdout: 'Some output', status: 500}, expected: {message:'Some output', status: 500}},
				{errObject: {stderr: '', stdout: 'Unknown command test', status: 0}, expected: {message:'Unknown command test', status: 500}},
				{errObject: {stderr: '', stdout: 'Command doesn\'t exist', status: 0}, expected: {message:'Command doesn\'t exist', status: 404}},
				{errObject: {stderr: '', stdout: 'Error executing command', status: 0}, expected: {message:'Error executing command', status: 500}},
				{errObject: {stderr: '', stdout: '', status: 500}, expected: {message:'', status: 500}},
				{errObject: {stderr: '', stdout: '', status: 0}, expected: null}
			];
			errors.forEach(function(err){
				var result = utils.handleSpawnError(err.errObject);
				expect(result).to.deep.equal(err.expected);
				if (result !== null) {
					expect(result).to.have.all.keys('message', 'status');
				}
			});
			done();
		});
	});
});