"use strict";

const express = require('express');
const crudAPI = express.Router();
const pg = require('pg');
const fs = require('fs');
const path = require('path');

// DB
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
crudAPI.get('/testCRUDAPI', (req, res) => {
    res.json({ message: req.originalUrl });
});

// USER ID
crudAPI.get('/user_id', function (req, res) {
    pool.connect(function (err, client, done) {
        const query = "select user_id from cege0043.cege0043_users where user_name = current_user;";
        client.query(query, function (err, result) {
            done();
            res.send(result.rows[0].user_id.toString());
        });
    });
});

// INSERT HOSPITAL
crudAPI.post('/insertHospital', function (req, res) {

    pool.connect(function (err, client, done) {

        const geometry = "st_geomfromtext('POINT(" + req.body.longitude + " " + req.body.latitude + ")',4326)";

        const query = `
            INSERT into cege0043.hospital
            (hospital_name, last_inspected, location, user_id)
            values ($1,$2, ${geometry},$3)
        `;

        client.query(query, [
            req.body.hospital_name,
            req.body.hospital_last_officially_inspected,
            req.body.user_id
        ], function (err, result) {
            done();
            res.json({ status: "hospital inserted" });
        });
    });
});

// INSERT REPORT
crudAPI.post('/insertCleanlinessQueueReport', function (req, res) {

    pool.connect(function (err, client, done) {

        const query = `
            insert into cege0043.hospital_cleanliness_queue_information
            (hospital_id, cleanliness, queue_length_id,user_id)
            values (
                (select hospital_id from cege0043.hospital where hospital_name = $1),
                $2,
                (select queue_length_id from cege0043.hospital_queue_length where queue_length_description = $3),
                $4
            )
        `;

        client.query(query, [
            req.body.hospital_name,
            req.body.cleanliness,
            req.body.queue_length_description,
            req.body.user_id
        ], function (err, result) {
            done();
            res.json({ status: "report inserted" });
        });
    });
});

module.exports = crudAPI;