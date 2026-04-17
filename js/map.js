"use strict";

/**
 * Leaflet map
 */
let mymap;

/**
 * Layer control
 */
let layerControl;

/**
 * Main hospital layer
 */
let defaultHospitalLayer = L.featureGroup();

/**
 * Reporting / analysis layer
 */
let reportingLayer = L.featureGroup();

/**
 * Current user location
 */
let currentUserLatLng = null;

/**
 * Selected location for new hospital
 */
let selectedHospitalLatLng = null;

/**
 * Whether hospital creation mode is active
 */
let hospitalCreationEnabled = false;

/**
 * Load map
 */
function loadMap() {
    mymap = L.map('mapid').setView([51.505, -0.09], 13);

    let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    let baseMaps = {
        "OpenStreetMap": osm
    };

    let overlayMaps = {
        "My Hospitals": defaultHospitalLayer,
        "Reporting Layer": reportingLayer
    };

    defaultHospitalLayer.addTo(mymap);
    reportingLayer.addTo(mymap);

    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(mymap);

    mymap.on('click', onMapClick);

    getUserLocation();
}

/**
 * Get browser user location
 */
function getUserLocation() {
    if (!navigator.geolocation) {
        console.log("Geolocation is not supported by this browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            currentUserLatLng = [
                position.coords.latitude,
                position.coords.longitude
            ];

            console.log("User location loaded:", currentUserLatLng);

            L.marker(currentUserLatLng)
                .bindPopup("You are here")
                .addTo(mymap);
        },
        function (error) {
            console.log("Could not get user location:", error);
        }
    );
}

/**
 * Enable hospital creation mode
 */
function enableHospitalCreation() {
    hospitalCreationEnabled = true;
    alert("Hospital creation mode enabled. Click on the map to choose a hospital location.");
}

/**
 * Disable hospital creation mode
 */
function disableHospitalCreation() {
    hospitalCreationEnabled = false;
}

/**
 * Map click handler
 */
function onMapClick(e) {
    console.log("Map clicked at:", e.latlng);

    if (!hospitalCreationEnabled) {
        return;
    }

    selectedHospitalLatLng = e.latlng;

    const latInput = document.getElementById("hospital_latitude");
    const lngInput = document.getElementById("hospital_longitude");
    const userIdInput = document.getElementById("hospital_user_id");

    if (latInput) {
        latInput.value = e.latlng.lat.toFixed(6);
    }

    if (lngInput) {
        lngInput.value = e.latlng.lng.toFixed(6);
    }

    if (userIdInput && typeof userId !== "undefined" && userId !== null) {
        userIdInput.value = userId;
    }

    if (typeof showDialog === "function") {
        showDialog("hospitalFormDialog");
    }
}

/**
 * Remove reporting layer contents
 */
function removeReportingLayer() {
    reportingLayer.clearLayers();
}

/**
 * Zoom to user location
 */
function zoomToUserLocation() {
    if (!currentUserLatLng) {
        alert("User location is not available yet.");
        return;
    }

    mymap.setView(currentUserLatLng, 16);
}

/**
 * Reload map data
 */
function reloadMapData() {
    if (typeof loadDefaultHospitalLayer === "function") {
        loadDefaultHospitalLayer();
    }
}

/**
 * Clear map layers
 */
function clearMapLayers() {
    defaultHospitalLayer.clearLayers();
    reportingLayer.clearLayers();
}