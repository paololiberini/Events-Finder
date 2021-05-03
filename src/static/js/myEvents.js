
// Request all the events added by a user
function fetchMyEvents () {

    let myEventsContainer = document.getElementById('myEventsContainer')
    myEventsContainer.innerHTML = ""

    fetch('/getMyEvents')
    .then(response => response.json())
    .then(response => {
        if(!response.length) {
            myEventsContainer.innerText = "No events published"
        }
    

        for(let i = 0; i < response.length; i++) {
    
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
            cardTitle.innerText = response[i].eventName
    
            var cardSubtitle = document.createElement("h6")
            cardSubtitle.classList.add("card-subtitle", "mb-2", "text-muted")
            cardSubtitle.innerHTML = '' + response[i].eventGenre + '<br>' + response[i].date + ' at ' + response[i].time
    
            let cardText = document.createElement("p")
            cardText.classList.add("card-text")
            cardText.innerText = response[i].description
    
            var buttonGroup = document.createElement("div")
            buttonGroup.classList.add("btn-group")
            buttonGroup.innerHTML = '<button type="button" class="btn btn-sm btn-delete btn-outline-secondary" onClick="deleteEvent(' + response[i].id + ')">Delete event</button>'
    
            cardbody.append(cardTitle)
            cardbody.append(cardSubtitle)
            cardbody.append(cardText)
            cardbody.append(buttonGroup)
            cardboard.append(cardbody)
            col.append(cardboard)
            row.append(col)
            myEventsContainer.append(row)
        }
    

    })
}


// Delete an event from the DB with a FETCH request
function deleteEvent(id) {
    var data = {
        id: id
    }
    

    fetch('/deleteEvent', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(fetchMyEvents())
}

fetchMyEvents()