"use strict";
let express = require('express');
let geoJSON = require('express').Router();
let pg = require('pg');
let fs = require('fs');
const os = require('os');

// get Linux username so we can locate the private DB connection file
const username = os.userInfo().username;
console.log(username);

// read DB connection file from /home/<username>/certs/postGISConnection.js
let configtext = "" + fs.readFileSync("/home/" + username + "/certs/postGISConnection.js");

// convert config text into a config object
let configarray = configtext.split(",");
let config = {};
for (let i = 0; i < configarray.length; i++) {
    let split = configarray[i].split(':');
    config[split[0].trim()] = split[1].trim();
}

// create connection pool
let pool = new pg.Pool(config);
console.log(config);

// test endpoint
geoJSON.route('/testGeoJSON').get(function (req, res) {
    res.json({message: req.originalUrl});
});

// basic PostGIS connectivity test
geoJSON.get('/postgistest', function (req, res) {
    pool.connect(function(err, client, done) {
        if (err) {
            console.log("not able to get connection " + err);
            return res.status(400).send(err);
        }

        let query = "select * from information_schema.columns";

        client.query(query, function(err, result) {
            done();
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            else {
                res.status(200).send(result.rows);
            }
        });
    });
});

// fixed GeoJSON endpoint for cege0043.asset_information
geoJSON.get('/asset_information', function (req, res) {
    pool.connect(function(err, client, done) {
        if (err) {
            console.log("not able to get connection " + err);
            return res.status(400).send(err);
        }

        let querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM ";
        querystring = querystring + "(SELECT 'Feature' As type, ST_AsGeoJSON(st_transform(lg.location,4326))::json As geometry, ";
        querystring = querystring + "row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date, user_id, timestamp) As l )) As properties ";
        querystring = querystring + "FROM cege0043.asset_information As lg order by id limit 100 ) As f";

        console.log(querystring);

        client.query(querystring, function(err, result) {
            done();
            if (err) {
                console.log(err);
                return res.status(400).send(err);
            }
            else {
                // convert result.rows from [ {FeatureCollection...} ] into {FeatureCollection...}
                let geoJSONData = JSON.stringify(result.rows);
                geoJSONData = geoJSONData.substring(1);
                geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1);
                res.status(200).send(JSON.parse(geoJSONData));
            }
        });
    });
});

// generic GeoJSON endpoint
geoJSON.get('/getGeoJSON/:schemaname/:tablename/:idcolumn/:geomcolumn', function (req, res) {
    pool.connect(function(err, client, done) {
        if (err) {
            console.log("not able to get connection " + err);
            return res.status(400).send(err);
        }

        let colnames = "";

        let tablename = req.params.tablename;
        let schema = req.params.schemaname;
        let idcolumn = req.params.idcolumn;
        let geomcolumn = req.params.geomcolumn;

        // get attribute column names except the geometry column
        let querystring = "select string_agg(colname,',') from ( select column_name as colname ";
        querystring = querystring + " FROM information_schema.columns as colname ";
        querystring = querystring + " where table_name = $1";
        querystring = querystring + " and column_name <> $2 and table_schema = $3 and data_type <> 'USER-DEFINED') as cols ";

        console.log(querystring);

        client.query(querystring, [tablename, geomcolumn, schema], function(err, result) {
            if (err) {
                console.log(err);
                done();
                return res.status(400).send(err);
            }
            else {
                let thecolnames = result.rows[0].string_agg;
                colnames = thecolnames;
                console.log("the colnames " + thecolnames);

                let cols = colnames.split(",");
                let colString = "";

                for (let i = 0; i < cols.length; i++) {
                    console.log(cols[i]);
                    colString = colString + JSON.stringify(cols[i]) + ",";
                }

                // remove last comma
                colString = colString.substring(0, colString.length - 1);

                // build GeoJSON query
                querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM ";
                querystring += "(select 'Feature' as type, x.properties, st_asgeojson(y.geometry)::json as geometry from ";
                querystring += " (select " + idcolumn + ", row_to_json((SELECT l FROM (SELECT " + colString + ") As l )) as properties FROM " + schema + "." + JSON.stringify(tablename) + " ";
                querystring += " ) x";
                querystring += " inner join (SELECT " + idcolumn + ", c.geom as geometry";
                querystring += " FROM ( SELECT " + idcolumn + ", (ST_Dump(st_transform(" + JSON.stringify(geomcolumn) + ",4326))).geom AS geom ";
                querystring += " FROM " + schema + "." + JSON.stringify(tablename) + ") c) y on y." + idcolumn + " = x." + idcolumn + ") f";

                console.log(querystring);

                client.query(querystring, function(err, result) {
                    done();
                    if (err) {
                        console.log(err);
                        return res.status(400).send(err);
                    }
                    else {
                        let geoJSONData = JSON.stringify(result.rows);
                        geoJSONData = geoJSONData.substring(1);
                        geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1);
                        console.log(geoJSONData);
                        res.status(200).send(JSON.parse(geoJSONData));
                    }
                });
            }
        });
    });
});

module.exports = geoJSON;