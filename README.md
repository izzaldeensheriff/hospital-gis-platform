# Hospital Cleanliness and Queue App (Full System)

## Overview
This project is a full-stack web and mobile GIS application that allows users to:
- Add hospitals to a map
- Report queue length and cleanliness
- View nearby hospitals
- Analyse data using charts and a 3D dashboard

The system integrates:
- Frontend (Leaflet + Cesium)
- Backend API (Node.js + Express)
- Spatial database (PostgreSQL + PostGIS)

---

## System Architecture

Frontend (Browser)
→ Leaflet (2D Map)
→ Cesium (3D Dashboard)

Backend
→ Node.js + Express API

Database
→ PostgreSQL + PostGIS

---

## Features

### Core Functionality
- Add new hospitals by clicking on the map
- Submit cleanliness and queue reports
- Automatically retrieve user ID from database
- Display hospitals belonging to the current user

### Spatial Analysis
- Find 5 closest hospitals
- Identify hospitals with unknown queue length
- Proximity alert (triggered within 25m using last 5 positions)

### Data Visualisation
- Queue length bar chart (Chart.js)
- 3D hospital visualisation (Cesium)
- Cleanliness keyword analysis (bubble display)

### Mobile Functionality
- Responsive layout
- Initial auto-centering on user location
- Optimised mobile interface

---

## Project Structure
/css
/js
map.js
utilities.js
dashboard.js
dialogs/
index.html
dashboard.html

### API Repository
dataAPI.js
/routes
crudAPI.js
geojsonAPI.js


---

## How to Run the System

### 1. Start the API Server

Navigate to the API repository and run:

```bash
node dataAPI.js

2. Run the Application

Open in browser:

index.html

To access dashboard:

dashboard.html

### App Repository

API Endpoints
CRUD API

Base:

code/cege0043-api-25-26-izzaldeensheriff/crudAPI/
GET /user_id
POST /insertHospital
POST /insertCleanlinessQueueReport

GeoJSON API

Base:

code/cege0043-api-25-26-izzaldeensheriff/geojsonAPI/
GET /getQueueLengths
GET /hospitalsByUser/:user_id
GET /fiveClosestHospitals/:lat/:lng
GET /lastFiveHospitalReports/:user_id
GET /numCleanlinessQueueReports/:user_id
GET /userCleanlinessQueueRanking/:user_id
GET /hospitalsByQueueLength
GET /hospitalsQueueLengthUnknown/:user_id

Database Configuration

Database connection file:

/home/isheriff/certs/postGISConnectionAPI.js

Spatial Functionality
Geometry stored using PostGIS (POINT)
Distance calculations using ST_Distance
GeoJSON generated using ST_AsGeoJSON
Closest hospitals calculated in database

Technologies Used
JavaScript (ES6)
Leaflet
CesiumJS
Chart.js
Bootstrap
Node.js / Express
PostgreSQL + PostGIS
Notes
Geolocation must be enabled for proximity alerts
Cesium uses a free access token (Ion)
All spatial queries handled in the database
Responsive design supports both desktop and mobile
