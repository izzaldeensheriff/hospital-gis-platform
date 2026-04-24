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
const pg = require("pg");
const fs = require("fs");
const path = require("path");

/**
 * Express router for CRUD API routes.
 */
const crudAPI = express.Router();

/**
 * Read database connection settings from the local config file.
 */
const username = process.env.USER || "isheriff";
const configPath = path.join("/home", username, "certs", "postGISConnectionAPI.js");
const configText = String(fs.readFileSync(configPath));
const configArray = configText.split(",");
const config = {};

for (let i = 0; i < configArray.length; i++) {
    const split = configArray[i].split(":");
    config[split[0].trim()] = split[1].trim();
}

/**
 * PostgreSQL connection pool.
 */
const pool = new pg.Pool(config);

/**
 * Test route for CRUD API.
 */
crudAPI.get("/testCRUDAPI", function (req, res) {
    res.json({ message: req.originalUrl });
});

/**
 * Return the current database user's user_id.
 */
crudAPI.get("/user_id", function (req, res) {
    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = "SELECT user_id FROM cege0043.cege0043_users WHERE user_name = current_user;";

        client.query(query, function (queryError, result) {
            done();

            if (queryError) {
                res.status(500).json({ error: "Failed to retrieve user ID." });
                return;
            }

            if (!result.rows || result.rows.length === 0) {
                res.status(404).json({ error: "User ID not found." });
                return;
            }

            res.send(result.rows[0].user_id.toString());
        });
    });
});

/**
 * Insert a new hospital submitted by the current user.
 */
crudAPI.post("/insertHospital", function (req, res) {
    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            INSERT INTO cege0043.hospital
            (hospital_name, last_inspected, location, user_id)
            VALUES (
                $1,
                $2,
                ST_GeomFromText('POINT(' || $3 || ' ' || $4 || ')', 4326),
                $5
            )
        `;

        client.query(
            query,
            [
                req.body.hospital_name,
                req.body.hospital_last_officially_inspected,
                req.body.longitude,
                req.body.latitude,
                req.body.user_id
            ],
            function (queryError) {
                done();

                if (queryError) {
                    res.status(500).json({ error: "Failed to insert hospital." });
                    return;
                }

                res.json({ status: "hospital inserted" });
            }
        );
    });
});

/**
 * Insert a new cleanliness and queue report for a hospital.
 */
crudAPI.post("/insertCleanlinessQueueReport", function (req, res) {
    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            INSERT INTO cege0043.hospital_cleanliness_queue_information
            (hospital_id, cleanliness, queue_length_id, user_id)
            VALUES (
                (SELECT hospital_id FROM cege0043.hospital WHERE hospital_name = $1),
                $2,
                (SELECT queue_length_id
                 FROM cege0043.hospital_queue_length
                 WHERE queue_length_description = $3),
                $4
            )
        `;

        client.query(
            query,
            [
                req.body.hospital_name,
                req.body.cleanliness,
                req.body.queue_length_description,
                req.body.user_id
            ],
            function (queryError) {
                done();

                if (queryError) {
                    res.status(500).json({ error: "Failed to insert report." });
                    return;
                }

                res.json({ status: "report inserted" });
            }
        );
    });
});

module.exports = crudAPI;