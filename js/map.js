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
 
 /**
 * Core Map Logic
 * Handles map initialisation, user location tracking,
 * layer management, and responsive behaviour.
 */
/**
 

"use strict";

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
 * Tracks whether the screen was previously mobile width.
 */
let wasMobileWidth = window.innerWidth < 768;

/**
 * Whether the initial mobile auto-centre has already happened.
 */
let hasAutoCenteredOnMobile = false;

/**
 * Load the Leaflet map and its layers.
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

            if (window.innerWidth < 768 && !hasAutoCenteredOnMobile) {
                mymap.setView(currentLatLngObject, 16);
                hasAutoCenteredOnMobile = true;
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
 * Handle map click events for hospital creation.
 * @param {Object} e - Leaflet click event.
 */
 /**
 * Handles user interaction when clicking on the map.
 * Used for selecting hospital location in creation mode.
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
 * Refresh map size after layout changes and refit visible data if possible.
 */
function refreshMapSize() {
    if (!mymap) {
        return;
    }

    setTimeout(function () {
        mymap.invalidateSize(true);

        try {
            if (defaultHospitalLayer && defaultHospitalLayer.getLayers().length > 0) {
                mymap.fitBounds(defaultHospitalLayer.getBounds(), { padding: [20, 20] });
                return;
            }

            if (reportingLayer && reportingLayer.getLayers().length > 0) {
                mymap.fitBounds(reportingLayer.getBounds(), { padding: [20, 20] });
                return;
            }
        } catch (error) {
            // Fall back to current view if bounds cannot be calculated.
        }

        mymap.setView(mymap.getCenter(), mymap.getZoom());
    }, 300);
}

/**
 * Refit the map when switching between desktop and mobile widths.
 */
window.addEventListener("resize", function () {
    const isMobileWidth = window.innerWidth < 768;

    refreshMapSize();

    if (isMobileWidth !== wasMobileWidth) {
        setTimeout(function () {
            try {
                if (defaultHospitalLayer && defaultHospitalLayer.getLayers().length > 0) {
                    mymap.fitBounds(defaultHospitalLayer.getBounds(), { padding: [20, 20] });
                    wasMobileWidth = isMobileWidth;
                    return;
                }

                if (reportingLayer && reportingLayer.getLayers().length > 0) {
                    mymap.fitBounds(reportingLayer.getBounds(), { padding: [20, 20] });
                    wasMobileWidth = isMobileWidth;
                    return;
                }
            } catch (error) {
                // Keep current map view if no valid bounds are available.
            }

            wasMobileWidth = isMobileWidth;
        }, 400);
    } else {
        wasMobileWidth = isMobileWidth;
    }
});