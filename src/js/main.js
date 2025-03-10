document.addEventListener('DOMContentLoaded', function() {
    const registrationForm = document.getElementById('registrationForm');
    const confirmationMessage = document.getElementById('confirmationMessage');
    const eventName = document.getElementById('eventName');
    const eventDate = document.getElementById('eventDate');
    const eventLocation = document.getElementById('eventLocation');
    const asciiHeadline = document.getElementById('asciiHeadline');

    // Fetch event information from the backend API
    fetch('/api/event')
        .then(response => response.json())
        .then(event => {
            eventName.textContent = `Event: ${event.name}`;
            eventDate.textContent = `Date: ${event.date}`;
            eventLocation.textContent = `Location: ${event.location}`;
        })
        .catch(error => console.error('Error fetching event information:', error));

    // Fetch ASCII art headline from the backend API
    fetch('/api/ascii-headline')
        .then(response => response.json())
        .then(data => {
            asciiHeadline.textContent = data.ascii;
        })
        .catch(error => console.error('Error fetching ASCII headline:', error));

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
                confirmationMessage.textContent = 'Registration successful! A confirmation email has been sent.';
                confirmationMessage.classList.remove('hidden');
                registrationForm.reset();
            } else {
                confirmationMessage.textContent = 'Registration failed. Please try again.';
                confirmationMessage.classList.remove('hidden');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            confirmationMessage.textContent = 'An error occurred. Please try again later.';
            confirmationMessage.classList.remove('hidden');
        });
    });
});

// Function to get a cookie value by name
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}