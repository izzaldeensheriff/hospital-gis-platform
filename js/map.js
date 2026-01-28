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

    // note the ordering of events below - the load event is set when the map is first initiatlised i.e. zoom etc set
    // so the load event needs to be set BEFORE the setView
    mymap = L.map('mapid').setView([51.505, -0.09], 13);
    let osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mymap);

    let baseMaps = {
        "OpenStreetMap": osm,
    };

    var overlayMaps = {
    };

    layerControl = L.control.layers(baseMaps,overlayMaps).addTo(mymap);
    } // end loadMap