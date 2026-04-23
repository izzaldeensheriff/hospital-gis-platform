"use strict";

const express = require('express');
const geojsonAPI = express.Router();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

// DB CONNECTION
const username = process.env.USER || 'isheriff';
const configPath = path.join('/home', username, 'certs', 'postGISConnectionAPI.js');
const configtext = '' + fs.readFileSync(configPath);
const configarray = configtext.split(',');
const config = {};

for (let i = 0; i < configarray.length; i++) {
    let split = configarray[i].split(':');
    config[split[0].trim()] = split[1].trim();
}

const pool = new pg.Pool(config);

// TEST
geojsonAPI.get('/testGeoJSONAPI', function (req, res) {
    res.json({ message: req.originalUrl });
});

// QUEUE LENGTHS
geojsonAPI.get('/getQueueLengths', function (req, res) {
    pool.connect(function (err, client, done) {
        const query = `
            select 'FeatureCollection' as type,
                   array_to_json(array_agg(f)) as features
            from (
                SELECT 'Feature' as type,
                       row_to_json(t) as properties
                FROM (
                    SELECT *
                    FROM cege0043.hospital_queue_length
                ) t
            ) f;
        `;

        client.query(query, function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// HOSPITALS BY USER
geojsonAPI.get('/hospitalsByUser/:user_id', function (req, res) {
    const user_id = req.params.user_id;

    pool.connect(function (err, client, done) {
        const query = `
            SELECT 'FeatureCollection' As type,
                   array_to_json(array_agg(f)) As features
            FROM (
                SELECT 'Feature' As type,
                       ST_AsGeoJSON(lg.location)::json As geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT hospital_id,
                                      hospital_name,
                                      last_inspected,
                                      hospital_latest_queue_length_and_cleanliness_date,
                                      queue_length_description,
                                      cleanliness
                           ) As l
                       )) As properties
                FROM cege0043.hospital_latest_queue_length_and_cleanliness As lg
                WHERE user_id = $1
                LIMIT 100
            ) As f;
        `;

        client.query(query, [user_id], function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// FIVE CLOSEST HOSPITALS
geojsonAPI.get('/fiveClosestHospitals/:latitude/:longitude', function (req, res) {
    const latitude = req.params.latitude;
    const longitude = req.params.longitude;

    pool.connect(function (err, client, done) {
        let sql = "";
        sql += "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM ";
        sql += "(SELECT 'Feature' As type, ST_AsGeoJSON(lg.location)::json As geometry, ";
        sql += "row_to_json((SELECT l FROM (SELECT hospital_id, hospital_name, last_inspected) As l)) As properties ";
        sql += "FROM (select c.* from cege0043.hospital c ";
        sql += "inner join (select hospital_id, st_distance(a.location, st_geomfromtext('POINT(" + longitude + " " + latitude + ")',4326)) as distance ";
        sql += "from cege0043.hospital a ";
        sql += "order by distance asc ";
        sql += "limit 5) b ";
        sql += "on c.hospital_id = b.hospital_id ) as lg) As f";

        client.query(sql, function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// LAST FIVE REPORTS BY USER
geojsonAPI.get('/lastFiveHospitalReports/:user_id', function (req, res) {
    const user_id = req.params.user_id;

    pool.connect(function (err, client, done) {
        const query = `
            SELECT 'FeatureCollection' As type,
                   array_to_json(array_agg(f)) As features
            FROM (
                SELECT 'Feature' As type,
                       ST_AsGeoJSON(lg.location)::json As geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT queue_length_id,
                                      cleanliness,
                                      user_id,
                                      queue_length_description,
                                      hospital_name
                           ) As l
                       )) As properties
                FROM (
                    select *
                    from cege0043.hospital_cleanliness_and_queue_length_with_text_description
                    where user_id = $1
                    order by timestamp desc
                    limit 5
                ) as lg
            ) As f;
        `;

        client.query(query, [user_id], function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// NUMBER OF REPORTS
geojsonAPI.get('/numCleanlinessQueueReports/:user_id', function (req, res) {
    const user_id = req.params.user_id;

    pool.connect(function (err, client, done) {
        const query = `
            select array_to_json(array_agg(c))
            from (
                SELECT COUNT(*) AS num_reports
                from cege0043.hospital_cleanliness_queue_information
                where user_id = $1
            ) c;
        `;

        client.query(query, [user_id], function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// USER RANKING
geojsonAPI.get('/userCleanlinessQueueRanking/:user_id', function (req, res) {
    const user_id = req.params.user_id;

    pool.connect(function (err, client, done) {
        const query = `
            select array_to_json(array_agg(hh))
            from (
                select c.rank
                from (
                    SELECT b.user_id, rank() over (order by num_reports desc) as rank
                    from (
                        select COUNT(*) AS num_reports, user_id
                        from cege0043.hospital_cleanliness_queue_information
                        group by user_id
                    ) b
                ) c
                where c.user_id = $1
            ) hh;
        `;

        client.query(query, [user_id], function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

// HOSPITALS BY QUEUE LENGTH
geojsonAPI.get('/hospitalsByQueueLength', function (req, res) {
    pool.connect(function (err, client, done) {
        const query = `
            select count(*) as num_hospitals, queue_length_description
            from cege0043.hospital_latest_queue_length_and_cleanliness
            where queue_length_description is not null
            group by queue_length_description;
        `;

        client.query(query, function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows);
        });
    });
});

// UNKNOWN QUEUE HOSPITALS
geojsonAPI.get('/hospitalsQueueLengthUnknown/:user_id', function (req, res) {
    const user_id = req.params.user_id;

    pool.connect(function (err, client, done) {
        const query = `
            SELECT 'FeatureCollection' As type,
                   array_to_json(array_agg(f)) As features
            FROM (
                SELECT 'Feature' As type,
                       ST_AsGeoJSON(location)::json As geometry,
                       row_to_json((
                           SELECT l FROM (
                               SELECT hospital_id,
                                      hospital_name,
                                      queue_length_description
                           ) As l
                       )) As properties
                FROM cege0043.hospital_latest_queue_length_and_cleanliness
                where queue_length_description = 'Unknown'
                and user_id = $1
            ) As f;
        `;

        client.query(query, [user_id], function (err, result) {
            done();
            if (err) return res.status(400).send(err);
            res.json(result.rows[0]);
        });
    });
});

module.exports = geojsonAPI;