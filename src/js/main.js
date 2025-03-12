document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const statusMessage = document.getElementById('statusMessage');
    const eventName = document.getElementById('eventName');
    const eventDate = document.getElementById('eventDate');
    const eventLocation = document.getElementById('eventLocation');

    // Fetch event information from the backend API
    fetch('/api/event')
        .then(response => response.json())
        .then(event => {
            eventName.textContent = `Event: ${event.name}`;
            eventDate.textContent = `Date: ${event.date}`;
            eventLocation.textContent = `Location: ${event.location}`;
        })
        .catch(error => console.error('Error fetching event information:', error));

    registrationForm.addEventListener('submit', function(event) {
        event.preventDefault();

        const formData = new FormData(registrationForm);
        const data = Object.fromEntries(formData.entries());

        fetch('/api/registrants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': getCookie('XSRF-TOKEN') // Include CSRF token in the headers
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                showStatusMessage('Registration successful! A confirmation email has been sent.', 'success');
                registrationForm.reset();
            } else {
                showStatusMessage('Registration failed. Please try again.', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage('An error occurred. Please try again later.', 'danger');
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