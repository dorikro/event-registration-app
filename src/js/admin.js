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

        if (!eventForm.checkValidity()) {
            eventForm.classList.add('was-validated');
            return;
        }

        const eventName = document.getElementById('event-name').value;
        const eventDate = document.getElementById('event-date').value;
        const eventLocation = document.getElementById('event-location').value;

        fetch('/api/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
            },
            body: JSON.stringify({ name: eventName, date: eventDate, location: eventLocation })
        })
        .then(response => response.json().then(body => {
            if (response.ok) {
                showStatusMessage(body.message, 'success');
                eventForm.reset();
                eventForm.classList.remove('was-validated');
                loadEvents();
            } else {
                console.error('Event addition failed:', body);
                showStatusMessage(`Failed to add event: ${body.message}`, 'danger');
            }
        }))
        .catch(error => {
            console.error('Error:', error);
            showStatusMessage(`An error occurred: ${error.message}`, 'danger');
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

    // Call this function after successful login or page load
    loadRegistrants();
    loadEvent();
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

// Modify loadRegistrants to include an "Edit" button for each row
function loadRegistrants() {
    const registrationTableBody = document.getElementById('registration-table').querySelector('tbody');
    registrationTableBody.innerHTML = '';
    fetch('/api/registrants')
      .then(response => response.json())
      .then(registrants => {
          registrants.forEach(reg => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${reg.name || reg.fullName}</td>
                  <td>${reg.email}</td>
                  <td>${reg.phone || reg.eventId || ''}</td>
                  <td>
                      <button class="btn btn-sm btn-warning" onclick="editRegistrant('${reg.id}')">Edit</button>
                      <button class="btn btn-sm btn-danger" onclick="deleteRegistrant('${reg.id}')">Delete</button>
                  </td>
              `;
              registrationTableBody.appendChild(row);
          });
      })
      .catch(error => console.error('Error fetching registrants:', error));
}

// Implement the editRegistrant function
function editRegistrant(id) {
    fetch(`/api/registrants/${id}`)
      .then(res => res.json())
      .then(data => {
          // Display data in a simple prompt or fill a form
          const newName = prompt("Edit Name:", data.name || data.fullName);
          const newEmail = prompt("Edit Email:", data.email);
          const newPhone = prompt("Edit Phone:", data.phone || data.phoneNumber);

          if (newName && newEmail && newPhone) {
              updateRegistrant(id, newName, newEmail, newPhone);
          }
      })
      .catch(err => console.error('Error editing registrant:', err));
}

// Implement the updateRegistrant function
function updateRegistrant(id, name, email, phone) {
    fetch(`/api/registrants/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify({ fullName: name, email, phoneNumber: phone, eventId: 'event123' })
    })
    .then(res => res.json())
    .then(body => {
        showStatusMessage(`${body.message}. please contact event administrator.`, 'success');
        loadRegistrants();
    })
    .catch(err => {
        console.error('Error updating registrant:', err);
        showStatusMessage(`Error updating registrant: ${err.message}. please contact event administrator.`, 'danger');
    });
}

// Add a refresh button
document.getElementById('refresh-button').addEventListener('click', loadRegistrants);

// Load existing event details
function loadEvent() {
    fetch('/api/event')
        .then(res => res.json())
        .then(event => {
            if (event && event.name) {
                document.getElementById('event-name').value = event.name;
                document.getElementById('event-date').value = event.date.split('T')[0];
                document.getElementById('event-location').value = event.location;
            document.getElementById('event-form-submit').textContent = 'Update Event';
            }
        })
        .catch(() => {
            document.getElementById('event-form-submit').textContent = 'Create Event';
        });
}

// Edit registrant
function editRegistrant(id) {
    fetch(`/api/registrants/${id}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('registrant-fullName').value = data.fullName;
            document.getElementById('registrant-email').value = data.email;
            document.getElementById('registrant-phoneNumber').value = data.phoneNumber;
            document.getElementById('registrant-id').value = id;
            document.getElementById('registrant-form-submit').textContent = 'Update Registrant';
        });
}

// Submit registrant update
function updateRegistrant(id) {
    const data = {
        fullName: document.getElementById('registrant-fullName').value,
        email: document.getElementById('registrant-email').value,
        phoneNumber: document.getElementById('registrant-phoneNumber').value,
        eventId: 'event'
    };

    fetch(`/api/registrants/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(body => {
        showStatusMessage(body.message, 'success');
        loadRegistrants();
    })
    .catch(err => {
        console.error('Error updating registrant:', err);
        showStatusMessage(`Error updating registrant: ${err.message}`, 'danger');
    });
}

// Ensure this function is called when the admin page loads
document.addEventListener('DOMContentLoaded', () => {
    loadRegistrants();
});

// Implement the deleteRegistrant function
function deleteRegistrant(id) {
    if (!confirm("Are you sure you want to delete this registrant?")) return;

    fetch(`/api/registrants/${id}`, {
        method: 'DELETE'
    })
    .then(res => res.json())
    .then(body => {
        console.log("Deleted:", body);
        loadRegistrants(); // Refresh table from Redis
    })
    .catch(err => console.error("Error deleting registrant:", err));
}