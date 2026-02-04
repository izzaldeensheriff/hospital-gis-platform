 "use strict"

 /**
 * busStopsLayer
 * 
 * a global variable to store the bus stops layer once it has been added to the map
 * global as will need to be referened by the bus stops remove functionality
 * 
 */
let busStopsLayer;

 function showBusStops() 

 {// as we are hosting the data on our server, we dono't need to provide the full https:// ... detail
	let layerURL = "./data/busstops.geojson";
	 $.ajax({url: layerURL, crossDomain: true,success: function(result){
			// load the geoJSON layer
    		busStopsLayer = L.geoJson(result,
        		{
            	// use point to layer to create the points
            	pointToLayer: function (feature, latlng){
		                return L.marker(latlng).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
           		},  // end of point to layer
        }).addTo(mymap);

    	// zoom to the layer
    	mymap.fitBounds(busStopsLayer.getBounds());

		} // end of the inner function
	}); // end of the ajax request

 	alert(" showBusStops")
 	// body...
 }


 function showBusStopsStyled() 

 { 

 	alert("showBusStopsStyled")
 	// body...
 }


 function removeBusStops() 

 {// we use a try / catch statement here - this means that if the layer has not yet been added we won't get an error message
	try {
			mymap.removeLayer( busStopsLayer);
		} catch (err) {

	}

 	alert(" removeBusStops ")
 	// body...
 }
