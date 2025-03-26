document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const statusMessage = document.getElementById('statusMessage');
    const eventName = document.getElementById('eventName');
    const eventDate = document.getElementById('eventDate');
    const eventLocation = document.getElementById('eventLocation');
    const dynamicHeadline = document.getElementById('dynamicHeadline');
    const eventNameEl = document.getElementById('eventName');
    const eventDateEl = document.getElementById('eventDate');
    const eventLocationEl = document.getElementById('eventLocation');

    // Fetch event information from the backend API
    fetch('/api/event')
        .then(response => response.json())
        .then(event => {
            if (!event || !event.name) {
                dynamicHeadline.textContent = 'Event registration is closed.';
                return;
            }

            dynamicHeadline.textContent = event.name;
            eventNameEl.textContent = `Event: ${event.name}`;
            eventDateEl.textContent = event.date ? `Date: ${event.date.split('T')[0]}` : '';
            eventLocationEl.textContent = `Location: ${event.location || ''}`;

            // Show start/end time on a separate line
            const timeString = (event.startTime && event.endTime) 
                ? `Time: ${event.startTime} - ${event.endTime}` 
                : '';
            document.getElementById('eventTime').textContent = timeString;
        })
        .catch(() => {
            dynamicHeadline.textContent = 'Event registration is closed.';
        });

    registrationForm.addEventListener('submit', function(event) {
        event.preventDefault();
        if (!registrationForm.checkValidity()) {
            registrationForm.classList.add('was-validated');
            return;
        }

        const data = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value
        };

        fetch('/api/registrants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            // Parse body AND keep response object
            return response.json().then(body => ({ response, body }));
        })
        .then(({ response, body }) => {
            if (!response.ok) {
                showStatusMessage(`Registration failed: ${body.message}`, 'danger');
                return;
            }
            registrationForm.reset();
            registrationForm.classList.remove('was-validated');
            registrationForm.classList.add('d-none');

            const confirmationMessage = document.getElementById('confirmationMessage');
            confirmationMessage.textContent = body.message;
            confirmationMessage.classList.remove('d-none');
        })
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage(`An error occurred: ${error.message}. please contact event administrator.`, 'danger');
        });
    });

    document.getElementById('domainSubmit').addEventListener('click', function() {
        const userDomain = document.getElementById('companyDomain').value.trim();

        fetch('/api/event')
            .then(res => res.json())
            .then(event => {
                if (!event.domain) {
                    alert("No event domain found. The event might be closed. Please contact the event admin.");
                    return;
                }
                if (event.domain === userDomain) {
                    // Show registration form
                    document.getElementById('registrationForm').classList.remove('d-none');
                } else {
                    alert("Incorrect domain. Please contact the event admin.");
                }
            })
            .catch(() => {
                alert("Failed to get event data. Please contact the event admin.");
            });
    });
});

// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Function to show status message
function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `alert alert-${type}`;
    statusMessage.classList.remove('d-none');
    setTimeout(() => {
        statusMessage.classList.add('d-none');
    }, 5000);
}