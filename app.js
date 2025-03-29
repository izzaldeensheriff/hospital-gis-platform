"use strict";
// express is the web server that forms part of the nodejs program
const express = require('express');
const path = require("path");
const fs = require('fs');
const app = express();

// add an https server to serve files 
const http = require('http');

const httpServer = http.createServer(app);
const httpServerPort = 4443;

httpServer.listen(httpServerPort);

app.get('/',function (req,res) {
	let date = new Date();
	res.send("Hello World from the App Server on Node port "+httpServerPort + " (mapped to Apache port 443).<br><br> The date is "+ date);
});

// adding functionality to log the requests
app.use(function (req, res, next) {
	let filename = path.basename(req.url);
	let extension = path.extname(filename);
	console.log("The file " + filename + " was requested.");
	next();
});

app.use(express.static(__dirname));