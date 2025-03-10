const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const { body, validationResult } = require('express-validator');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const path = require('path');
const figlet = require('figlet');
const fs = require('fs');

const app = express();
const port = 80;

const client = redis.createClient({
  host: 'redis-service',
  port: 6379
});

// Middleware setup
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'src')));

// CSRF token middleware
app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken());
  next();
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'src', 'index.html'));
});

// Serve admin.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'src', 'admin.html'));
});

// API to get event information
app.get('/api/event', (req, res) => {
  client.hgetall('events', (err, events) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    const event = JSON.parse(events[Object.keys(events)[0]]); // Assuming there's only one event
    res.send(event);
  });
});

// API to get ASCII art headline
app.get('/api/ascii-headline', (req, res) => {
  client.hgetall('events', (err, events) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    const eventName = events ? JSON.parse(events[Object.keys(events)[0]]).name : 'event';
    figlet(eventName, (err, data) => {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }
      res.send({ ascii: data });
    });
  });
});

// API to get events
app.get('/api/events', (req, res) => {
  client.hgetall('events', (err, events) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    res.send(events);
  });
});

// API to add/update event
app.post('/api/events', [
  body('name').isString().trim().escape(),
  body('date').isISO8601().toDate(),
  body('location').isString().trim().escape(),
  body('ownerName').isString().trim().escape(),
  body('ownerPhone').isMobilePhone()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, name, date, location, ownerName, ownerPhone } = req.body;
  client.hset('events', id, JSON.stringify({ name, date, location, ownerName, ownerPhone }), (err) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    res.send('Event added/updated successfully');
  });
});

// API to get registrants
app.get('/api/registrants', (req, res) => {
  client.hgetall('registrants', (err, registrants) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    res.send(registrants);
  });
});

// API to add/update registrant
app.post('/api/registrants', [
  body('fullName').isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phoneNumber').isMobilePhone(),
  body('eventId').isString().trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id, fullName, email, phoneNumber, eventId } = req.body;
  client.hset('registrants', id, JSON.stringify({ fullName, email, phoneNumber, eventId }), (err) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }
    res.send('Registrant added/updated successfully');
  });
});

// API to get admin password
app.get('/api/admin-password', (req, res) => {
  const adminPassword = process.env.ADMIN_PASSWORD;
  res.send({ password: adminPassword });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});