"use strict"
function showHardCodedData() 
// add a circle
	let myCircle=L.circle([51.508, -0.11], 250, {
		color: 'green',
		fillColor: 'green',
		fillOpacity: 0.8
	}).addTo(mymap).bindPopup("I am a circle in 2024.");

	console.log("added a circle");

	// add a polygon
	let myPolygon = L.polygon([
		[51.709, -0.10],
		[51.703, 0.07],
		[51.22, 0.07],
		[51.22, -0.057]
	],{
		color: 'blue',
		fillColor: 'blue',
		fillOpacity: 0.5
	}).addTo(mymap).bindPopup("I am a polygon in 2024.");


	// add a point
	let myMarker = L.marker([51.508, -0.10],
	{}).addTo(mymap).bindPopup("this is a point<br>with two rows");


