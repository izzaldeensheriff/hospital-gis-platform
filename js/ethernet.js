"use strict";

let ethernetLayer;

function showEthernetStyled() {

  // styles
  let style1 = { color: "#ea3008", weight: 10, opacity: 0.65 };
  let style2 = { color: "pink",    weight: 10, opacity: 0.65 };
  let style3 = { color: "#0811EA",  weight: 10, opacity: 0.65 };

  let layerURL = "./data/ethernet.geojson";

  $.ajax({
    url: layerURL,
    crossDomain: true,
    success: function (result) {

      ethernetLayer = L.geoJson(result, {

        // STYLE function → correct for lines
        style: function (feature) {
          switch (String(feature.properties.criticality)) {
            case "2":
              return style1;
            case "3":
              return style2;
            default:
              return style3;
          }
        },

        // POPUPS
        onEachFeature: function (f, l) {
          l.bindPopup(
            '<pre>' +
            JSON.stringify(f.properties, null, 2)
              .replace(/[\{\}"]/g,'') +
            '</pre>'
          );
        }

      }).addTo(mymap);

      // zoom to data
      mymap.fitBounds(ethernetLayer.getBounds());

      alert("showEthernetStyled");
    }
  });
}

function removeEthernet() {
  try {
    mymap.removeLayer(ethernetLayer);
  } catch (err) {}
}
