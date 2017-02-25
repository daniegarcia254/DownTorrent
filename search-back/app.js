var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

var search = require('./search')
app.use('/api', search)

app.listen(process.env.APP_PORT, function () {
	console.log('Example app listening on port '+process.env.APP_PORT+'!')
});
