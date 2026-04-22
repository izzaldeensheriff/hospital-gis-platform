"use strict";

/**
 * Leaflet map instance.
 */
let mymap;

/**
 * Leaflet layer control.
 */
let layerControl;

/**
 * Main hospital layer.
 */
let defaultHospitalLayer = L.featureGroup();

/**
 * Reporting / analysis layer.
 */
let reportingLayer = L.featureGroup();

/**
 * Current user location as [lat, lng].
 */
let currentUserLatLng = null;

/**
 * Current user location marker.
 */
let currentUserLocationMarker = null;

/**
 * Last five user positions.
 */
let lastFivePositions = [];

/**
 * Selected location for new hospital.
 */
let selectedHospitalLatLng = null;

/**
 * Whether hospital creation mode is enabled.
 */
let hospitalCreationEnabled = false;

/**
 * Load the map.
 */
function loadMap() {
    mymap = L.map("mapid").setView([51.505, -0.09], 13);

    const osm = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    const baseMaps = {
        "OpenStreetMap": osm
    };

    const overlayMaps = {
        "My Hospitals": defaultHospitalLayer,
        "Reporting Layer": reportingLayer
    };

    defaultHospitalLayer.addTo(mymap);

    if (layerControl) {
        mymap.removeControl(layerControl);
    }

    layerControl = L.control.layers(baseMaps, overlayMaps, {
        collapsed: true,
        position: "topright"
    }).addTo(mymap);

    mymap.on("click", handleMapClick);

    getUserLocation();
    refreshMapSize();
    setTimeout(refreshMapSize, 500);
}

/**
 * Track browser user location continuously.
 */
function getUserLocation() {
    if (!navigator.geolocation) {
        return;
    }

    navigator.geolocation.watchPosition(
        function (position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            currentUserLatLng = [lat, lng];
            const currentLatLngObject = L.latLng(lat, lng);

            if (currentUserLocationMarker) {
                currentUserLocationMarker.setLatLng(currentLatLngObject);
            } else {
                currentUserLocationMarker = L.marker(currentLatLngObject)
                    .bindPopup("You are here")
                    .addTo(mymap);
            }

            lastFivePositions.push(currentLatLngObject);

            if (lastFivePositions.length > 5) {
                lastFivePositions.shift();
            }

            if (
                window.innerWidth < 768 &&
                typeof isDefaultLayerActive === "function" &&
                isDefaultLayerActive()
            ) {
                mymap.setView(currentLatLngObject, 16);
            }

            if (typeof checkProximityAlert === "function") {
                checkProximityAlert();
            }
        },
        function () {
            return;
        },
        {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000
        }
    );
}

/**
 * Enable hospital creation mode.
 */
function enableHospitalCreation() {
    hospitalCreationEnabled = true;
    alert("Hospital creation mode enabled. Click on the map to choose a hospital location.");
}

/**
 * Disable hospital creation mode.
 */
function disableHospitalCreation() {
    hospitalCreationEnabled = false;
}

/**
 * Handle map click events.
 * @param {Object} e - Leaflet event.
 */
function handleMapClick(e) {
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

    showDialog("hospitalFormDialog");
}

/**
 * Zoom to the current user location.
 */
function zoomToUserLocation() {
    if (!currentUserLatLng) {
        alert("User location is not available yet.");
        return;
    }

    mymap.setView(currentUserLatLng, 16);
}

/**
 * Reload the default hospital layer.
 */
function reloadMapData() {
    if (typeof showOnlyDefaultLayer === "function") {
        showOnlyDefaultLayer();
    }
}

/**
 * Refresh map size after layout changes.
 */
function refreshMapSize() {
    if (!mymap) {
        return;
    }

    setTimeout(function () {
        mymap.invalidateSize(true);
        mymap.setView(mymap.getCenter(), mymap.getZoom());
    }, 300);
}

/**
 * Listen for window resize events.
 */
window.addEventListener("resize", refreshMapSize);