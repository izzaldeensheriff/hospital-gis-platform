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
 * Custom top-right layer button control.
 */
let customLayerControl;

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

    addCustomLayerButton();

    mymap.on("click", handleMapClick);

    getUserLocation();
    refreshMapSize();
    setTimeout(refreshMapSize, 500);
}

/**
 * Add a custom top-right layer button so the icon is always visible.
 */
function addCustomLayerButton() {
    if (customLayerControl) {
        mymap.removeControl(customLayerControl);
    }

    customLayerControl = L.control({ position: "topright" });

    customLayerControl.onAdd = function () {
        const container = L.DomUtil.create("div");
        container.style.background = "#ffffff";
        container.style.border = "2px solid rgba(0,0,0,0.2)";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
        container.style.padding = "0";
        container.style.overflow = "hidden";

        const button = L.DomUtil.create("button", "", container);
        button.type = "button";
        button.innerHTML = '<i class="fa fa-layer-group"></i>';
        button.title = "Layer options";
        button.style.width = "34px";
        button.style.height = "34px";
        button.style.border = "none";
        button.style.background = "#ffffff";
        button.style.cursor = "pointer";
        button.style.fontSize = "16px";

        const panel = L.DomUtil.create("div", "", container);
        panel.style.display = "none";
        panel.style.background = "#ffffff";
        panel.style.borderTop = "1px solid #dddddd";
        panel.style.minWidth = "150px";

        const defaultLink = L.DomUtil.create("a", "", panel);
        defaultLink.href = "#";
        defaultLink.innerText = "Show My Hospitals";
        defaultLink.style.display = "block";
        defaultLink.style.padding = "8px 10px";
        defaultLink.style.textDecoration = "none";
        defaultLink.style.color = "#111827";
        defaultLink.style.fontSize = "14px";

        const closestLink = L.DomUtil.create("a", "", panel);
        closestLink.href = "#";
        closestLink.innerText = "Closest Hospitals";
        closestLink.style.display = "block";
        closestLink.style.padding = "8px 10px";
        closestLink.style.textDecoration = "none";
        closestLink.style.color = "#111827";
        closestLink.style.fontSize = "14px";

        const unknownLink = L.DomUtil.create("a", "", panel);
        unknownLink.href = "#";
        unknownLink.innerText = "Unknown Queue";
        unknownLink.style.display = "block";
        unknownLink.style.padding = "8px 10px";
        unknownLink.style.textDecoration = "none";
        unknownLink.style.color = "#111827";
        unknownLink.style.fontSize = "14px";

        const closePanelLink = L.DomUtil.create("a", "", panel);
        closePanelLink.href = "#";
        closePanelLink.innerText = "Hide Panel";
        closePanelLink.style.display = "block";
        closePanelLink.style.padding = "8px 10px";
        closePanelLink.style.textDecoration = "none";
        closePanelLink.style.color = "#111827";
        closePanelLink.style.fontSize = "14px";

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        L.DomEvent.on(button, "click", function (e) {
            L.DomEvent.preventDefault(e);
            panel.style.display = panel.style.display === "none" ? "block" : "none";
        });

        L.DomEvent.on(defaultLink, "click", function (e) {
            L.DomEvent.preventDefault(e);
            if (typeof showOnlyDefaultLayer === "function") {
                showOnlyDefaultLayer();
            }
            panel.style.display = "none";
        });

        L.DomEvent.on(closestLink, "click", function (e) {
            L.DomEvent.preventDefault(e);
            if (typeof getClosestHospitals === "function") {
                getClosestHospitals();
            }
            panel.style.display = "none";
        });

        L.DomEvent.on(unknownLink, "click", function (e) {
            L.DomEvent.preventDefault(e);
            if (typeof getUnknownQueueHospitals === "function") {
                getUnknownQueueHospitals();
            }
            panel.style.display = "none";
        });

        L.DomEvent.on(closePanelLink, "click", function (e) {
            L.DomEvent.preventDefault(e);
            panel.style.display = "none";
        });

        return container;
    };

    customLayerControl.addTo(mymap);
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