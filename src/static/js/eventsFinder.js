
const resultsContainer = document.getElementById("resultsContainer")
const searchForm = document.getElementById('searchForm')
const loginForm = document.getElementById('loginForm')
const signupForm = document.getElementById('signupForm')
var auth = false

var username

var resultsArray

$('[data-toggle="popover"]').popover()

// Show results on page, adding elements by rows and columns to #resultsContainer. Called by search function
function showResults(eventsJson) {
    clearMap()
    resultsContainer.innerHTML = ""
    latLngArray = []

    elementNumber = eventsJson.length
    lineNumbers = Math.floor(eventsJson.length / 3) + 1
    var el = 0

    if(elementNumber == 0) {
        resultsContainer.innerHTML = "<h2 class='text-center'>No results :(</h2>"
    }
    else {

        for(var i = 0; i < lineNumbers; i++) {
            var row = document.createElement("div")
            row.classList.add("row")

            for(var l = elementNumber; l > 0 && el < elementNumber; l--) {
                var col = document.createElement("div")
                col.classList.add("col-md-4")

                var cardboard = document.createElement("div")
                cardboard.classList.add("card", "mb-4", "shadow-sm")
                cardboard.id = eventsJson[el].id

                var cardbody = document.createElement("div")
                cardbody.classList.add("card-body")

                var cardTitle = document.createElement("h5")
                cardTitle.classList.add("card-title")
                cardTitle.innerText = eventsJson[el].eventName

                var cardSubtitle = document.createElement("h6")
                cardSubtitle.classList.add("card-subtitle", "mb-2", "text-muted")
                cardSubtitle.innerHTML = '' + eventsJson[el].eventGenre + '<br>' + fixDate(eventsJson[el].date) + ' at ' + eventsJson[el].time

                var cardText = document.createElement("p")
                cardText.classList.add("card-text")
                cardText.innerText = eventsJson[el].description.substring(0, 60) + '...'

                var buttonGroup = document.createElement("div")
                buttonGroup.classList.add("btn-group")
                buttonGroup.innerHTML = '<button type="button" class="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target="#moreInfoModal" onClick="moreInfoFill(' + eventsJson[el].id + ')">Show More</button> <button type="button" class="btn btn-sm btn-outline-secondary">Price: ' + eventsJson[el].price + '€</button> <button type="button" class="btn btn-sm btn-outline-secondary" onClick="showOnMap(' + eventsJson[el].id + ')">Show on map</button> <button type="button" onClick="addFavourite(' + eventsJson[el].id + ')" class="btn btn-sm btn-outline-secondary"><svg class="bi bi-heart" width="1em" height="1em" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M8 2.748l-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 01.176-.17C12.72-3.042 23.333 4.867 8 15z" clip-rule="evenodd"/></svg></button>'

                cardbody.append(cardTitle)
                cardbody.append(cardSubtitle)
                cardbody.append(cardText)
                cardbody.append(buttonGroup)
                cardboard.append(cardbody)
                col.append(cardboard)
                row.append(col)

                addPoints(eventsJson[el].lat, eventsJson[el].long, eventsJson[el].id, eventsJson[el].eventName)

                el++
            }
            resultsContainer.append(row)
        }

        updateMapMarkers()
    }


    document.getElementById("resultsContainer").scrollIntoView()
}


// Reformat date to gg/mm/yyyy
function fixDate(date) {
    let splittedDate = date.split('-')
    let newDate = '' + splittedDate[2] + '/' + splittedDate[1] + '/' + splittedDate[0]

    return newDate
}


// Collects data from the search form and send them as GET request to the server, with parameters in the URL
function search(e) {

    e.preventDefault()
    var searchBar = document.getElementById("searchBar").value
    var completeUrl = '?search=' + searchBar

    var tags = document.getElementsByClassName("searchCheckbox")
    var eventType = ''
    var eventTypeSwitch = false


    for(let i = 0; i < tags.length; i++) {
        if (tags[i].checked) {
            eventType = eventType + tags[i].value + ','
            eventTypeSwitch = true
        }
    }

    completeUrl = completeUrl + (eventTypeSwitch ? "&eventGenre=" + eventType : "")
    

    var searchRadio = document.getElementsByClassName("searchRadio")

    for (let l = 0; l < searchRadio.length; l++) {
        if(searchRadio[l].checked) {
            var radioValue = searchRadio[l].value
        }
    }

    switch(radioValue) {
        case "myPosition":
            let userLat = userPosition.lat
            let userLong = userPosition.lng
            let userRange = rangeDimension.value * 30000
            completeUrl = completeUrl + '&lat=' + userLat + '&long=' + userLong + '&range=' + userRange
            break;

        case "selectedPosition":
            let selectedLat = selectedPosition.lat
            let selectedLong = selectedPosition.lng
            let selectedRange = rangeDimension.value * 30000
            completeUrl = completeUrl + '&lat=' + selectedLat + '&long=' + selectedLong + '&range=' + selectedRange

            break;

        case "everywhere":
            break;
    }

    fetch('/search' + completeUrl, {
        credentials: 'include'
    }) 
        .then(response => response.json())
        .then(data => {
            showResults(data)
            resultsArray = data
        })
    
}


// Show the correct menu for logged-in users
function loggedIn() {
    let topbarButtons = document.getElementById('userButtons')
    let userInfo = document.getElementById('userInfo')

    topbarButtons.innerHTML = '<a type="button" class="btn btn-outline-primary" id="addButton" href="/add">Add new</a> <a type="button" class="btn btn-outline-primary" id="addButton" href="/myEvents">My Events</a> <a class="btn btn-outline-primary" href="/auth/logout">Log out</a>'
    userInfo.innerText = "Welcome, " + username
}


// Login function. Send data to the server as POST request, with username and password in body (json)
loginForm.addEventListener('submit', function(e) {

    e.preventDefault()

    let data = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    }

    fetch('/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(!response.ok) { 
            throw new Error("Not 2xx Response")
        }
        return response
    })
    .then(response => response.json())
    .then(response => {
        if(response.auth == true) {
            auth = true
            username = response.user
            var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-success', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Login success! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')

            $('#loginModal').modal('hide')

            loggedIn()

        } else {
            var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-danger', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Wrong username or password! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')
        }
    })
    .catch(err => {
        var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-danger', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Wrong username or password! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')
    })    
})


// Signup functions. Collects data from form and send them to the server (fetch POST json). It shows a success or a failure popover
signupForm.addEventListener('submit', function(e) {
    
    e.preventDefault()

    let data = {
        email: document.getElementById('signupEmail').value,
        name: document.getElementById('signupName').value,
        surname: document.getElementById('signupSurname').value,
        password: document.getElementById('signupPassword').value
    }

    fetch('/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(!response.ok) { 
            throw new Error("Not 2xx Response")
        }
        return response
    })
    .then(response => response.json())
    .then(response => {
        if(response.auth == true) {
            auth = true
            username = response.user
            var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-success', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Register success! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')

            $('#signupModal').modal('hide')

            loggedIn()

        } else {
            var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-danger', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Error! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')
        }
    })
    .catch(err => {
        var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-danger', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Error! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')
    })
})


// Fill more info modal with information of the selected event
function moreInfoFill(id) {

    for(let i = 0; i < resultsArray.length; i++) {
        if(id == resultsArray[i].id) {
            document.getElementById('infoModalTitle').innerText = resultsArray[i].eventName
            document.getElementById('infoModalBody').innerText = resultsArray[i].description
        }
    }
    
}


// Add an event to a favourite list on local storage
function addFavourite(id) {

    for(let i = 0; i < resultsArray.length; i++) {
        if(id == resultsArray[i].id) {
            localStorage.setItem(id, JSON.stringify(resultsArray[i]))
        }
    }
}


// Show the favourite events putting them inside the modal body
function showFavourite() {
    let favouriteContent = document.getElementById('favouriteModalContent')
    favouriteContent.innerHTML = ""

    keys = Object.keys(localStorage)

    if(!keys.length) {
        favouriteContent.innerText = "No events saved"
    }

    for(let i = 0; i < keys.length; i++) {
        let parsedValues = JSON.parse(localStorage[keys[i]])

        let row = document.createElement("div")
        row.classList.add("row")

        let col = document.createElement("div")
        col.classList.add("col-md-12")

        let cardboard = document.createElement("div")
        cardboard.classList.add("card")

        let cardbody = document.createElement("div")
        cardbody.classList.add("card-body")

        let cardTitle = document.createElement("h5")
        cardTitle.classList.add("card-title")
        cardTitle.innerText = parsedValues.eventName

        var cardSubtitle = document.createElement("h6")
        cardSubtitle.classList.add("card-subtitle", "mb-2", "text-muted")
        cardSubtitle.innerHTML = '' + parsedValues.eventGenre + '<br>' + fixDate(parsedValues.date) + ' at ' + parsedValues.time

        let cardText = document.createElement("p")
        cardText.classList.add("card-text")
        cardText.innerText = parsedValues.description

        var buttonGroup = document.createElement("div")
        buttonGroup.classList.add("btn-group")
        buttonGroup.innerHTML = '<button type="button" class="btn btn-sm btn-outline-secondary" onClick="removeFavourite(' + parsedValues.id + ')">Remove</button>'

        cardbody.append(cardTitle)
        cardbody.append(cardSubtitle)
        cardbody.append(cardText)
        cardbody.append(buttonGroup)
        cardboard.append(cardbody)
        col.append(cardboard)
        row.append(col)
        favouriteContent.append(row)
    }

}


// Remove a favourite from local storage
function removeFavourite(key) {
    
    localStorage.removeItem(key)
    showFavourite()

}


// Verify the authentication of the user on the page
async function isAuthenticated() {

    fetch('/auth/authenticated', {
        credentials : 'include'
    })
    .then(response => response.json())
    .then(response => {
        if(response.auth == true) {
            username = response.user
            auth = true
            loggedIn()
        }
    })
}


searchForm.addEventListener('submit', search)
isAuthenticated()