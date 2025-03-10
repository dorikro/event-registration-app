const apiUrl = 'http://your-api-url'; // Replace with your API URL

document.addEventListener('DOMContentLoaded', function () {
    loadEvents();
    loadRegistrants();

    document.getElementById('event-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addEvent();
    });
});

function loadEvents() {
    fetch('/api/events')
        .then(response => response.json())
        .then(events => {
            const eventSelect = document.getElementById('event');
            eventSelect.innerHTML = '<option value="">Select an event</option>';
            for (const id in events) {
                const event = JSON.parse(events[id]);
                const option = document.createElement('option');
                option.value = id;
                option.textContent = event.name;
                eventSelect.appendChild(option);
            }
        })
        .catch(error => console.error('Error fetching events:', error));
}

function loadRegistrants() {
    fetch('/api/registrants')
        .then(response => response.json())
        .then(registrants => {
            const registrationTable = document.getElementById('registration-table').getElementsByTagName('tbody')[0];
            registrationTable.innerHTML = '';
            for (const id in registrants) {
                const registrant = JSON.parse(registrants[id]);
                const row = registrationTable.insertRow();
                row.insertCell(0).textContent = registrant.fullName;
                row.insertCell(1).textContent = registrant.email;
                row.insertCell(2).textContent = registrant.phoneNumber;
                row.insertCell(3).textContent = registrant.eventId;
                row.insertCell(4).innerHTML = `<button onclick="editRegistrant('${id}')">Edit</button>`;
            }
        })
        .catch(error => console.error('Error fetching registrants:', error));
}

function addEvent() {
    const id = Date.now().toString();
    const name = document.getElementById('event-name').value;
    const date = document.getElementById('event-date').value;
    const location = document.getElementById('event-location').value;
    const ownerName = document.getElementById('owner-name').value;
    const ownerPhone = document.getElementById('owner-phone').value;

    fetch('/api/events', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id, name, date, location, ownerName, ownerPhone })
    })
    .then(response => response.text())
    .then(message => {
        alert(message);
        loadEvents();
    })
    .catch(error => console.error('Error adding event:', error));
}

function editRegistrant(id) {
    // Logic to edit registrant
    alert(`Edit registrant with ID: ${id}`);
}