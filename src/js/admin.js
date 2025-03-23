const apiUrl = 'http://your-api-url'; // Replace with your API URL

document.addEventListener('DOMContentLoaded', function () {
    const passwordProtection = document.getElementById('password-protection');
    const adminContent = document.getElementById('admin-content');
    const passwordSubmit = document.getElementById('password-submit');
    const adminPassword = document.getElementById('admin-password');
    const statusMessage = document.getElementById('status-message');

    // Hardcoded correct password for demonstration purposes
    const correctPassword = 'admin13}x�3';

    passwordSubmit.addEventListener('click', function() {
        console.log('Entered password:', adminPassword.value); // Log the entered password
        if (adminPassword.value === correctPassword) {
            passwordProtection.classList.add('d-none');
            adminContent.classList.remove('d-none');
            console.log('Password validation successful'); // Log successful validation
        } else {
            adminPassword.classList.add('is-invalid');
            console.log('Password validation failed'); // Log failed validation
        }
    });

    const eventForm = document.getElementById('event-form');

    if (!eventForm) {
        console.error('Event form not found');
        return;
    }

    eventForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Event form submitted'); // Log form submission

        const eventName = document.getElementById('event-name').value;
        const eventDate = document.getElementById('event-date').value;
        const eventLocation = document.getElementById('event-location').value;

        console.log('Event data:', { name: eventName, date: eventDate, location: eventLocation }); // Log event data

        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN') // Correct header name
            },
            body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation })
        })
        .then(response => {
            if (response.ok) {
                showStatusMessage('Event added successfully!', 'success');
                eventForm.reset();
                loadEvents();
            } else {
                return response.json().then(errorData => {
                    console.error('Failed to add event:', errorData);
                    showStatusMessage('Failed to add event. Please try again.', 'danger');
                });
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage('An error occurred. Please try again later.', 'danger');
        });
    });

    const registrationTableBody = document.getElementById('registration-table').querySelector('tbody');

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

// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to show status message
function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `alert alert-${type}`;
    statusMessage.classList.remove('d-none');
    setTimeout(() => {
        statusMessage.classList.add('d-none');
    }, 5000);
}