"use strict"

// a fucnction to show the earthqukae data pulled form the API

function showEarthquakes()  {  let layerURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson";
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

