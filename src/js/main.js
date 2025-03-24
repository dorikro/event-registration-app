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

        if (!registrationForm.checkValidity()) {
            registrationForm.classList.add('was-validated');
            return;
        }

        const formData = new FormData(registrationForm);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone')
        };

        fetch('/api/registrants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json().then(body => {
            if (response.ok) {
                showStatusMessage(body.message, 'success');
                registrationForm.reset();
                registrationForm.classList.remove('was-validated');
            } else {
                console.error('Registration failed:', body);
                showStatusMessage(`Registration failed: ${body.message}`, 'danger');
            }
        }))
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
                    alert("The event registration is closed at this time. Please contact the event admin.");
                    return;
                }
                if (event.domain === userDomain) {
                    document.getElementById('registrationForm').classList.remove('d-none');
                } else {
                    alert("Incorrect company domain. Please contact the event admin.");
                }
            })
            .catch(() => {
                alert("The event registration is closed at this time. Please contact the event admin.");
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