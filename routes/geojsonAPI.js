"use strict";

const express = require("express");
const pg = require("pg");
const fs = require("fs");
const path = require("path");

/**
 * Express router for GeoJSON API routes.
 */
const geojsonAPI = express.Router();

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
 * Test route for GeoJSON API.
 */
geojsonAPI.get("/testGeoJSONAPI", function (req, res) {
    res.json({ message: req.originalUrl });
});

/**
 * Return all queue length categories as a GeoJSON-like feature collection.
 */
geojsonAPI.get("/getQueueLengths", function (req, res) {
    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT 'FeatureCollection' AS type,
                   array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                       row_to_json(t) AS properties
                FROM (
                    SELECT *
                    FROM cege0043.hospital_queue_length
                ) t
            ) f;
        `;

        client.query(query, function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return hospitals created by a specific user with latest queue and cleanliness data.
 */
geojsonAPI.get("/hospitalsByUser/:user_id", function (req, res) {
    const userId = req.params.user_id;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT 'FeatureCollection' AS type,
                   array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(lg.location)::json AS geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT hospital_id,
                                      hospital_name,
                                      last_inspected,
                                      hospital_latest_queue_length_and_cleanliness_date,
                                      queue_length_description,
                                      cleanliness
                           ) AS l
                       )) AS properties
                FROM cege0043.hospital_latest_queue_length_and_cleanliness AS lg
                WHERE user_id = $1
                LIMIT 100
            ) AS f;
        `;

        client.query(query, [userId], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return the five closest hospitals to the supplied latitude and longitude.
 */
geojsonAPI.get("/fiveClosestHospitals/:latitude/:longitude", function (req, res) {
    const latitude = req.params.latitude;
    const longitude = req.params.longitude;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT 'FeatureCollection' AS type,
                   array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(lg.location)::json AS geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT hospital_id,
                                      hospital_name,
                                      last_inspected
                           ) AS l
                       )) AS properties
                FROM (
                    SELECT c.*
                    FROM cege0043.hospital c
                    INNER JOIN (
                        SELECT hospital_id,
                               ST_Distance(
                                   a.location,
                                   ST_GeomFromText('POINT(' || $1 || ' ' || $2 || ')', 4326)
                               ) AS distance
                        FROM cege0043.hospital a
                        ORDER BY distance ASC
                        LIMIT 5
                    ) b
                    ON c.hospital_id = b.hospital_id
                ) AS lg
            ) AS f;
        `;

        client.query(query, [longitude, latitude], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return the last five hospital reports submitted by a user.
 */
geojsonAPI.get("/lastFiveHospitalReports/:user_id", function (req, res) {
    const userId = req.params.user_id;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT 'FeatureCollection' AS type,
                   array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(lg.location)::json AS geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT queue_length_id,
                                      cleanliness,
                                      user_id,
                                      queue_length_description,
                                      hospital_name
                           ) AS l
                       )) AS properties
                FROM (
                    SELECT *
                    FROM cege0043.hospital_cleanliness_and_queue_length_with_text_description
                    WHERE user_id = $1
                    ORDER BY timestamp DESC
                    LIMIT 5
                ) AS lg
            ) AS f;
        `;

        client.query(query, [userId], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return the number of cleanliness and queue reports submitted by a user.
 */
geojsonAPI.get("/numCleanlinessQueueReports/:user_id", function (req, res) {
    const userId = req.params.user_id;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT array_to_json(array_agg(c))
            FROM (
                SELECT COUNT(*) AS num_reports
                FROM cege0043.hospital_cleanliness_queue_information
                WHERE user_id = $1
            ) c;
        `;

        client.query(query, [userId], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return the current user's report ranking.
 */
geojsonAPI.get("/userCleanlinessQueueRanking/:user_id", function (req, res) {
    const userId = req.params.user_id;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT array_to_json(array_agg(hh))
            FROM (
                SELECT c.rank
                FROM (
                    SELECT b.user_id,
                           rank() OVER (ORDER BY num_reports DESC) AS rank
                    FROM (
                        SELECT COUNT(*) AS num_reports,
                               user_id
                        FROM cege0043.hospital_cleanliness_queue_information
                        GROUP BY user_id
                    ) b
                ) c
                WHERE c.user_id = $1
            ) hh;
        `;

        client.query(query, [userId], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

/**
 * Return the number of hospitals in each queue length category.
 */
geojsonAPI.get("/hospitalsByQueueLength", function (req, res) {
    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT COUNT(*) AS num_hospitals,
                   queue_length_description
            FROM cege0043.hospital_latest_queue_length_and_cleanliness
            WHERE queue_length_description IS NOT NULL
            GROUP BY queue_length_description;
        `;

        client.query(query, function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows);
        });
    });
});

/**
 * Return hospitals with unknown queue length for a specific user.
 */
geojsonAPI.get("/hospitalsQueueLengthUnknown/:user_id", function (req, res) {
    const userId = req.params.user_id;

    pool.connect(function (connectionError, client, done) {
        if (connectionError) {
            res.status(500).json({ error: "Database connection failed." });
            return;
        }

        const query = `
            SELECT 'FeatureCollection' AS type,
                   array_to_json(array_agg(f)) AS features
            FROM (
                SELECT 'Feature' AS type,
                       ST_AsGeoJSON(location)::json AS geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT hospital_id,
                                      hospital_name,
                                      queue_length_description
                           ) AS l
                       )) AS properties
                FROM cege0043.hospital_latest_queue_length_and_cleanliness
                WHERE queue_length_description = 'Unknown'
                  AND user_id = $1
            ) AS f;
        `;

        client.query(query, [userId], function (queryError, result) {
            done();

            if (queryError) {
                res.status(400).send(queryError);
                return;
            }

            res.json(result.rows[0]);
        });
    });
});

module.exports = geojsonAPI;