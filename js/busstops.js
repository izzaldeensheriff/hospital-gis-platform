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
      let testMarkerRed = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'red'
        });
      let testMarkerGray = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'gray'
        });
      
        let testMarkerPink = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'pink'
        });

        let testMarkerBlue = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'blue'
        });

        let testMarkerPurple = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'purple'
        });
        let testMarkerGreen = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'green'
        });

        let testMarkerBlack = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'black'
        });

        let testMarkerYellow = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'yellow'
        });

        let testMarkerOrange = L.AwesomeMarkers.icon({
            icon: 'play',
            markerColor: 'orange'
        });


        	                  // look at the GeoJSON file - specifically at the properties - to see the busstops type
	                  if (feature.properties.LOCALITY == 'Saltash Passage') {
	                     return L.marker(latlng, {icon: testMarkerGray }).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
	                  if (feature.properties.LOCALITY == 'Barne Barton') {
	                     return L.marker(latlng, {icon:testMarkerOrange}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
	                  if (feature.properties.LOCALITY == 'St Budeaux') {
	                     return L.marker(latlng, {icon:testMarkerPurple}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
	                  if (feature.properties.LOCALITY == 'Stoke') {
	                     return L.marker(latlng, {icon:testMarkerPink}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
	                  if (feature.properties.LOCALITY == 'Ham') {
	                     return L.marker(latlng, {icon:testMarkerBlue}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
					 if (feature.properties.LOCALITY == 'Plympton') {
	                     return L.marker(latlng, {icon:testMarkerGreen}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }

	                  if (feature.properties.LOCALITY == 'Efford') {
	                     return L.marker(latlng, {icon:testMarkerYellow}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');
	                  }
	                  else {
	                    return L.marker(latlng, {icon:testMarkerBlack}).bindPopup('<pre>'+JSON.stringify(feature.properties,null,' ').replace(/[\{\}"]/g,'')+'</pre>');;
	                  }

 	alert(" showBusStopsStyled ")
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
