"use strict";

/**
 * Global map object
 */
let mymap;

/**
 * Layer control
 */
let layerControl;

/**
 * Mode control
 */
let hospitalCreationMode = false;

/**
 * Selected hospital location
 */
let selectedHospitalLatLng = null;

/**
 * Layers
 */
let defaultHospitalLayer = L.layerGroup();
let reportingLayer = L.layerGroup();
let userLocationLayer = L.layerGroup();

/**
 * User location
 */
let currentUserLatLng = null;

/**
 * Load map
 */
function loadMap() {
    mymap = L.map('mapid', {
        zoomControl: true
    }).setView([51.505, -0.09], 13);

    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mymap);

    const baseMaps = {
        "OpenStreetMap": osm
    };

    const overlayMaps = {
        "My Hospitals": defaultHospitalLayer,
        "Reporting Layer": reportingLayer,
        "My Location": userLocationLayer
    };

    defaultHospitalLayer.addTo(mymap);
    userLocationLayer.addTo(mymap);

    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(mymap);

    mymap.on('click', onMapClick);

    loadUserLocation();
}

/**
 * Handle map click
 *
 * @param {Object} e - Leaflet click event
 */
function onMapClick(e) {
    if (!hospitalCreationMode) {
        return;
    }

    selectedHospitalLatLng = e.latlng;

    document.getElementById("hospital_latitude").value = e.latlng.lat;
    document.getElementById("hospital_longitude").value = e.latlng.lng;
    document.getElementById("hospital_user_id").value = userId;

    showDialog("hospitalFormDialog");
}

/**
 * Enable hospital creation mode
 */
function enableHospitalCreation() {
    hospitalCreationMode = true;
    console.log("Hospital creation mode enabled");
}

/**
 * Disable hospital creation mode
 */
function disableHospitalCreation() {
    hospitalCreationMode = false;
    selectedHospitalLatLng = null;
}

/**
 * Load user location using browser GPS
 */
function loadUserLocation() {
    if (!navigator.geolocation) {
        console.log("Geolocation not supported");
        return;
    }

    navigator.geolocation.watchPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            currentUserLatLng = [lat, lng];
            updateUserLocation(lat, lng);
        },
        function (error) {
            console.log("Geolocation error:", error.message);
        },
        {
            enableHighAccuracy: true
        }
    );
}

/**
 * Update user location marker
 *
 * @param {number} lat
 * @param {number} lng
 */
function updateUserLocation(lat, lng) {
    userLocationLayer.clearLayers();

    const marker = L.marker([lat, lng]).bindPopup("Your Location");
    userLocationLayer.addLayer(marker);
}

/**
 * Zoom to user location
 */
function zoomToUserLocation() {
    if (!currentUserLatLng) {
        alert("User location not available yet");
        return;
    }

    mymap.setView(currentUserLatLng, 16);
}

/**
 * Clear all layers except base map
 */
function clearMapLayers() {
    defaultHospitalLayer.clearLayers();
    reportingLayer.clearLayers();
}

/**
 * Remove reporting layer and restore default hospital layer
 */
function removeReportingLayer() {
    reportingLayer.clearLayers();

    if (!mymap.hasLayer(defaultHospitalLayer)) {
        defaultHospitalLayer.addTo(mymap);
    }
}

/**
 * Reload map data
 */
function reloadMapData() {
    console.log("Reloading data...");

    if (typeof loadUserHospitals === "function") {
        loadUserHospitals();
    }
}

/**
 * Add a hospital marker to the default layer
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} name
 */
function addHospitalMarker(lat, lng, name) {
    const marker = L.marker([lat, lng]).bindPopup("<b>" + name + "</b>");
    defaultHospitalLayer.addLayer(marker);
}