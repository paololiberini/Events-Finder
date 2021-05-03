var mymap = L.map('mapid').setView([41, 12], 5);
var missingPositionAlert = document.getElementById('missingPositionAlert');

var latLngArray = [];
var markerLayer = L.layerGroup();

var selectedPositionLayer = L.layerGroup();
var userPositionLayer = L.layerGroup();

var userPosition;
var selectedPosition;
var rangeDimension = document.getElementById("range");


// Main function
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1
}).addTo(mymap);


// In case of geolocation position, update the variables and the map
function onLocationSuccess(e) {
    var radius = e.accuracy / 2;
    L.marker(e.latlng).addTo(userPositionLayer);
    L.circle(e.latlng, rangeDimension.value * 30000).addTo(userPositionLayer);
    userPosition = e.latlng;

    document.getElementById('radioMyPosition').removeAttribute('disabled')
}


// In case of missing geolocation position, it show an error
function showMissingPositionError() {
    var alert = document.createElement('div');
    alert.classList.add('alert', 'alert-warning', 'alert-dismissable', 'fade', 'show');
    alert.innerHTML = 'Position not found! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
    document.getElementsByTagName('body')[0].prepend(alert);
    alert.classList.add('show')
}


// In case of missing position, this show a generic map of Italy
function onLocationError(e) {
    mymap.setView([41, 12], 5);
    showMissingPositionError();
}


// Add marker to the markeLayer and to latLngArray
function addPoints(lat, long, id, name) {
    var marker = L.marker([lat, long], {"title": id}).bindPopup(name).on('mouseover', overMarker).on("click", clickOnMarker).addTo(markerLayer)
    latLngArray.push([lat, long])
}


// When mouse go over a marker, change card style
function overMarker(e) {
    let id = this.options.title;
    let allCards = document.getElementsByClassName("card mb-4")
    let element = document.getElementById(id);

    for(let i = 0; i < allCards.length; i++) {
        allCards[i].classList = "card mb-4 shadow-sm"
    }

    element.classList.remove("shadow-sm")
    element.classList.add("selectedCard")
}


function shadowLocateOnMap(el) {
    let id = el.options.title;
    let allCards = document.getElementsByClassName("card mb-4")
    let element = document.getElementById(id);

    for(let i = 0; i < allCards.length; i++) {
        allCards[i].classList = "card mb-4 shadow-sm"
    }

    element.classList.remove("shadow-sm")
    element.classList.add("selectedCard")
}


// When click on map marker, scroll to the element on events list
function clickOnMarker(e) {
    let id = this.options.title
    document.getElementById(id).parentElement.scrollIntoView()
}


function clearMap() {
    markerLayer.clearLayers();
}


// Add the markerLayer to the map and recenter it
function updateMapMarkers() {
    markerLayer.addTo(mymap)
    mymap.fitBounds(latLngArray)
}


function showOnMap(id) {
    let layers = markerLayer.getLayers()
    for(let i = 0; i < layers.length; i++) {
        if(layers[i].options.title == id) {
            mymap.setView([layers[i]._latlng.lat, layers[i]._latlng.lng], 10)
            shadowLocateOnMap(layers[i])
            document.getElementById("mapid").scrollIntoView()
        }
    }
}


// When click on map, this clear the selectedPositionLayer and redraw the circle. Also fills the Selected Position radio.
function onMapSelectedPosition(e) {
    selectedPosition = e.latlng
    selectedPositionLayer.clearLayers()

    L.popup().setLatLng(e.latlng).setContent("Search here").addTo(selectedPositionLayer);
    L.circle(selectedPosition, rangeDimension.value * 30000).addTo(selectedPositionLayer)
    selectedPositionLayer.addTo(mymap)

    document.getElementById('radioSelectedPosition').removeAttribute('disabled')
    document.getElementById('radioSelectedPosition').click()

}


// Change visualization on map based on radio button search check
function radioOnClick() {
    
    var searchRadio = document.getElementsByClassName("searchRadio")

    mymap.removeLayer(selectedPositionLayer)
    mymap.removeLayer(userPositionLayer)

    for (let l = 0; l < searchRadio.length; l++) {
        if(searchRadio[l].checked) {
            var radioValue = searchRadio[l].value
        }
    }

    switch(radioValue) {
        case "myPosition":
            userPositionLayer.addTo(mymap)
            break;

        case "selectedPosition":
            selectedPositionLayer.addTo(mymap)

            break;

        case "everywhere":
            break;
    }
}


// Circle range dimension
rangeDimension.oninput = function() {

    userPositionLayer.clearLayers()
    L.marker(userPosition).addTo(userPositionLayer);
    L.circle(userPosition, rangeDimension.value * 30000).addTo(userPositionLayer);

    selectedPositionLayer.clearLayers()
    L.circle(selectedPosition, rangeDimension.value * 30000).addTo(selectedPositionLayer);

    var searchRadio = document.getElementsByClassName("searchRadio")

    for (let l = 0; l < searchRadio.length; l++) {
        if(searchRadio[l].checked) {
            var radioValue = searchRadio[l].value
        }
    }

    switch(radioValue) {
        case "myPosition":
            userPositionLayer.addTo(mymap)
            break;

        case "selectedPosition":
            selectedPositionLayer.addTo(mymap)
            break;

        case "everywhere":
            break;
    }

}


mymap.on('locationfound', onLocationSuccess);
mymap.on('locationerror', onLocationError);
mymap.on('click', onMapSelectedPosition)

mymap.locate({setView: true, maxZoom: 16});