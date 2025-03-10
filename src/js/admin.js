const apiUrl = 'http://your-api-url'; // Replace with your API URL

document.addEventListener('DOMContentLoaded', function () {
    loadEvents();
    loadRegistrants();

    document.getElementById('event-form').addEventListener('submit', function (e) {
        e.preventDefault();
        addEvent();
    });

    const passwordProtection = document.getElementById('password-protection');
    const adminContent = document.getElementById('admin-content');
    const passwordSubmit = document.getElementById('password-submit');
    const adminPassword = document.getElementById('admin-password');

    let correctPassword = '';

    // Fetch the admin password from the server
    fetch('/api/admin-password')
        .then(response => response.json())
        .then(data => {
            correctPassword = data.password;
        })
        .catch(error => console.error('Error fetching admin password:', error));

    passwordSubmit.addEventListener('click', function() {
        if (adminPassword.value === correctPassword) {
            passwordProtection.classList.add('d-none');
            adminContent.classList.remove('d-none');
        } else {
            adminPassword.classList.add('is-invalid');
        }
    });

    const eventForm = document.getElementById('event-form');
    const registrationTableBody = document.getElementById('registration-table').querySelector('tbody');

    eventForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const eventName = document.getElementById('event-name').value;
        const eventDate = document.getElementById('event-date').value;
        const eventLocation = document.getElementById('event-location').value;

        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': getCookie('XSRF-TOKEN') // Include CSRF token in the headers
            },
            body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation })
        })
        .then(response => {
            if (response.ok) {
                alert('Event added successfully!');
                eventForm.reset();
            } else {
                alert('Failed to add event. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again later.');
        });
    });

    // Fetch registered users and populate the table
    fetch('/api/registrants')
        .then(response => response.json())
        .then(registrants => {
            registrants.forEach(registrant => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${registrant.fullName}</td>
                    <td>${registrant.email}</td>
                    <td>${registrant.eventId}</td>
                    <td><button class="btn btn-danger btn-sm">Delete</button></td>
                `;
                registrationTableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching registrants:', error));
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

// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}