"use strict";

const express = require('express');
const path = require("path");
const http = require('http');

const dataAPI = express();
const httpServer = http.createServer(dataAPI);
const port = 4480;

httpServer.listen(port, function () {
    console.log("Data API server listening on port " + port);
});

dataAPI.use(express.json());
dataAPI.use(express.urlencoded({ extended: true }));

// CORS
dataAPI.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    next();
});

// logging
dataAPI.use(function (req, res, next) {
    const filename = path.basename(req.url);
    console.log("The file " + filename + " was requested.");
    next();
});

// test
dataAPI.get('/', function (req, res) {
    res.send("hello world from the Data API on port: " + port);
});

// routes
const geojsonAPI = require('./routes/geojsonAPI');
const crudAPI = require('./routes/crudAPI');

// local/jest paths
dataAPI.use('/api/geojsonAPI', geojsonAPI);
dataAPI.use('/api/crudAPI', crudAPI);

// CEGE server/browser paths
dataAPI.use('/geojsonAPI', geojsonAPI);
dataAPI.use('/crudAPI', crudAPI);