/**
 * AI Assistance Acknowledgement:
 * This file was developed with the assistance of ChatGPT (OpenAI, GPT-5.3).
 * ChatGPT was used to support debugging, code structuring, and optimisation.
 * All outputs were reviewed, tested, and adapted by the author.
 * 
 * Tool: ChatGPT
 * Version: GPT-5.3
 * Provider: OpenAI
 * URL: https://chat.openai.com/
 */

"use strict";

const express = require("express");
const path = require("path");
const http = require("http");

/**
 * Express application instance.
 */
const dataAPI = express();

/**
 * HTTP server wrapping the Express app.
 */
const httpServer = http.createServer(dataAPI);

/**
 * Server port.
 */
const port = 4480;

/**
 * Start the API server.
 */
httpServer.listen(port, function () {
    console.log("Data API server listening on port " + port);
});

/**
 * Parse JSON and URL-encoded request bodies.
 */
dataAPI.use(express.json());
dataAPI.use(express.urlencoded({ extended: true }));

/**
 * Enable CORS for browser-based requests.
 */
dataAPI.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.setHeader("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    next();
});

/**
 * Log requested file paths.
 */
dataAPI.use(function (req, res, next) {
    const filename = path.basename(req.url);
    console.log("The file " + filename + " was requested.");
    next();
});

/**
 * Simple root test route.
 */
dataAPI.get("/", function (req, res) {
    res.send("hello world from the Data API on port: " + port);
});

/**
 * Route handlers.
 */
const geojsonAPI = require("./routes/geojsonAPI");
const crudAPI = require("./routes/crudAPI");

/**
 * API routes for browser app and testing.
 */
dataAPI.use("/api/geojsonAPI", geojsonAPI);
dataAPI.use("/api/crudAPI", crudAPI);

/**
 * Direct routes retained for compatibility with CEGE server/browser paths.
 */
dataAPI.use("/geojsonAPI", geojsonAPI);
dataAPI.use("/crudAPI", crudAPI);