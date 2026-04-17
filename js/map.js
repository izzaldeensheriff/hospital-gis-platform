/**
 * variable to store the leaflet map so that we can get hold of the map and make changes via code
 */
let mymap; // stores the leaflet map

/**
 * variable to store the leaflet layer control so that we can get hold of the map and make changes via code
 */
let layerControl; // the leaflet layer control

/**
 * function to load a leaflet map in to an existing DIV, with OSM baselayer and a default layer control created for later use
 */
function loadMap() {

    mymap = L.map('mapid').setView([51.505, -0.09], 13);

    let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    let baseMaps = {
        "OpenStreetMap": osm,
    };

    let overlayMaps = {};

    layerControl = L.control.layers(baseMaps, overlayMaps).addTo(mymap);

    // ✅ FIXED: correct click handler
    mymap.on('click', onMapClick);

    // keep this only if it exists
    if (typeof keyPressZoomToPoint === "function") {
        mymap.on('keydown', keyPressZoomToPoint);
    }

}

/**
 * ✅ NEW: map click handler for adding hospitals
 */
function onMapClick(e) {

    console.log("Map clicked at:", e.latlng);

    if (typeof hospitalCreationEnabled !== "undefined" && hospitalCreationEnabled === true) {

        selectedHospitalLatLng = e.latlng;

        const latInput = document.getElementById("hospital_latitude");
        const lngInput = document.getElementById("hospital_longitude");

        if (latInput) {
            latInput.value = e.latlng.lat.toFixed(6);
        }

        if (lngInput) {
            lngInput.value = e.latlng.lng.toFixed(6);
        }

        if (typeof showDialog === "function") {
            showDialog("hospitalFormDialog");
        }
    }
}