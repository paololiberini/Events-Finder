var mymap = L.map('mapadd').setView([41, 12], 5);
var missingPositionAlert = document.getElementById('missingPositionAlert');

var selectedPositionLayer = L.layerGroup();

var selectedPosition;


L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1
}).addTo(mymap);


function clearMap() {
    markerLayer.clearLayers();
}


function onMapSelectedPosition(e) {
    selectedPosition = e.latlng
    selectedPositionLayer.clearLayers()

    L.marker(e.latlng).setLatLng(e.latlng).addTo(selectedPositionLayer);
    selectedPositionLayer.addTo(mymap)

    fillLatLongForm(selectedPosition.lat, selectedPosition.lng)
}


mymap.on('click', onMapSelectedPosition)

mymap.locate({setView: true, maxZoom: 16});