 "use strict"
 function processMapClick()
 /**
 * function onMapClick - creates a pop up when the user clicks on the map
 * 
 * @params e  - the click event - this holds information about where the user has actually clicked
 */

function onMapClick(e) {
	// create a new Leaflet pop up
	let popup = L.popup();
	
	// add some values to the pop up to show the coordinates
	popup
		.setLatLng(e.latlng)
		.setContent("You clicked the map at " + e.latlng.toString())
		.openOn(mymap);
}

/**
 * function onMapClickDiv - takes the results of the location where the use clicks and adds it to a DIV
 * 
 * @params e  - the click event - this holds information about where the user has actually clicked
 */

function onMapClickDiv(e) {
     document.getElementById("clickCoordinates").innerHTML = "Clicked on Lat, Lon : " + e.latlng.lat + ", " + e.latlng.lng;

}


/**
 * function zoomToExtents - zoom to the extent of all the data when the user clicks on the ctrl-e key if they are hovering over the map
 * 
 * @params e  - the click event - this holds information about where the user has actually clicked
 */

function keyPressZoomToPoint(e) {

	if 	(e.originalEvent.ctrlKey && e.originalEvent.key === "e") {
		mymap.flyTo([51.508, -0.11],12)

		// we don't want this specific event to propagate
		// event propagation is when the event is sent to the browser once it has completed on the map 
		// we stop propagation by 
		e.originalEvent.preventDefault();
	}


} 