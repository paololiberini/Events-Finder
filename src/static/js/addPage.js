const inputForm = document.getElementById('addEventForm')


function fillLatLongForm(lat,long) {
    document.getElementById('lat').value = lat
    document.getElementById('long').value = long
}


// Event listener for submit form, with a fetch POST Json
inputForm.addEventListener('submit', function(e) {

    e.preventDefault()

    var data = {
        eventName: document.getElementById('eventName').value,
        eventGenre: document.getElementById('eventGenre').value,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        description: document.getElementById('description').value,
        price: document.getElementById('price').value,
        lat: document.getElementById('lat').value,
        long: document.getElementById('long').value,
        totalTickets: document.getElementById('totalTickets').value
    }
    

    fetch('/addEvent', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if(response.status == 200) {
            var alert = document.createElement('div');
            alert.classList.add('alert', 'alert-success', 'alert-dismissable', 'fade', 'show');
            alert.innerHTML = 'Submit success! <button type="button" class="close" data-dismiss="alert" aria-label="Close"> <span aria-hidden="true">&times;</span> ';
            document.getElementsByTagName('body')[0].prepend(alert);
            alert.classList.add('show')

            document.getElementById('addEventForm').reset()
        }
    })
})