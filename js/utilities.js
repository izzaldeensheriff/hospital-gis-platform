"use strict"
/**
* function to load Cesium and Leaflet maps when the page load has completed
* 
*/
// makes sure that the map is only loaded once the page has completely loaded
// i.e. the div for the map must exist before the code tries to load the map
document.addEventListener('DOMContentLoaded', function() {
  console.log("listener domcontentloaded");
  loadMap();


}, false);
