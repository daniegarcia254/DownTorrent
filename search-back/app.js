'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const app = express()

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(function(req, res, next) {
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
})

var search = require('./search')
app.use('/api', search)

const server = require('http').createServer(app)
const io = require('socket.io')(server)

var ws = require("./ws.js")(io)

ws.connect()

server.listen(process.env.APP_PORT, function () {
	console.log('Example app listening on port '+process.env.APP_PORT+'!')
});
