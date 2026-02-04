"use strict"

// a fucnction to show the earthqukae data pulled form the API

function showEarthquakes()  {  //code to create the icons to the earthquake points depending on their magnitude//

	let layerURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
	 $.ajax({url: layerURL, crossDomain: true,success: function(result){

    		// add the JSON layer onto the map - it will appear using the default icons
	 		// the onEachFeature command loops through every featulre in the GeoJSON dataset and creates the popup for each one
    		let earthquakeLayer = L.geoJson(result, {
    				onEachFeature: function (f, l) {
   							l.bindPopup('<pre>'+JSON.stringify(f.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
					}
			}).addTo(mymap);

    		// change the map zoom so that all the data is shown
    		mymap.fitBounds(earthquakeLayer.getBounds());
		} // end of the inner function
	}); // end of the ajax request
	 alert(" showEarthquakes");
}

function showStyledEarthquakes() 
{ 
	let testMarkerGreen = L.AwesomeMarkers.icon({
        icon: 'play',
        markerColor: 'green'
    });
    let testMarkerPink = L.AwesomeMarkers.icon({
        icon: 'play',
        markerColor: 'pink'
    });
    alert(" showStyledEarthquakes ")

    
//the code to load the earthquake data//


	 let layerURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
	 $.ajax({url: layerURL, crossDomain: true,success: function(result){
			// load the geoJSON layer
    		let earthquakeLayer = L.geoJson(result,
        		{
            	// use point to layer to create the points
            	pointToLayer: function (feature, latlng){
		              // look at the GeoJSON file - specifically at the properties - to see the earthquake magnitude and use a different marker depending on this value
		              // also include a pop-up that shows the place value of the earthquakes
            		  // we also just use the place in the pop up icon
		              if (feature.properties.mag > 1.75) {
		                 return L.marker(latlng, {icon:testMarkerGreen}).bindPopup("<b>"+feature.properties.place +"</b>");
		              }
		              else {
		                // magnitude is 1.75 or less
		                return L.marker(latlng, {icon:testMarkerPink}).bindPopup("<b>"+feature.properties.place +"</b>");;
		              }
           		},  // end of point to layer
        }).addTo(mymap);

    	// zoom to the layer
    	mymap.fitBounds(earthquakeLayer.getBounds());

		} // end of the inner function
	}); // end of the ajax request
}