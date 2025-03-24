const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const { body, validationResult } = require('express-validator');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const path = require('path');
const figlet = require('figlet');
const rateLimit = require('express-rate-limit');

const app = express();
const port = 80;

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: 6379
});

// Middleware setup
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csurf({ cookie: true }));
app.use(express.static(path.join(__dirname, '..', '..', 'src')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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
  console.log('Serving admin.html'); // Add logging
  res.sendFile(path.join(__dirname, '..', '..', 'src', 'admin.html'));
});

// API to get event information
app.get('/api/event', (req, res) => {
  client.get('event', (err, eventData) => {
    if (err) return res.status(500).json({ message: "Redis error" });
    if (!eventData) return res.status(400).json({ message: "No event found" });
    res.json(JSON.parse(eventData));
  });
});

// API to get ASCII art headline
app.get('/api/ascii-headline', (req, res) => {
  client.get('event', (err, event) => {
    if (err) {
      console.error('Error fetching ASCII art headline:', err);
      return res.status(500).send('Internal Server Error');
    }
    const eventName = event ? JSON.parse(event).name : 'event';
    figlet(eventName, (err, data) => {
      if (err) {
        console.error('Error generating ASCII art headline:', err);
        return res.status(500).send('Internal Server Error');
      }
      res.send({ ascii: data });
    });
  });
});

// API to get events
app.get('/api/events', (req, res) => {
  client.get('event', (err, event) => {
    if (err) {
      console.error('Error fetching events:', err);
      return res.status(500).send('Internal Server Error');
    }
    res.send(JSON.parse(event));
  });
});

// API to add/update event
app.post('/api/events', [
  body('name').isString().trim().escape(),
  body('domain').isString().trim().escape(),
  body('date').isISO8601().toDate(),
  body('startTime').matches(/^\d{2}:\d{2}$/),
  body('endTime').matches(/^\d{2}:\d{2}$/),
  body('location').isString().trim().escape()
], (req, res) => {
  console.log('POST /api/events received:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
  }

  const { name, domain, date, startTime, endTime, location } = req.body;
  client.set('event', JSON.stringify({ name, domain, date, startTime, endTime, location }), (err) => {
    if (err) {
      console.error('Redis error adding/updating event:', err);
      return res.status(500).json({ message: 'Redis error', error: err.message });
    }
    console.log('Event added/updated successfully:', { name, domain, date, startTime, endTime, location });
    res.json({ message: 'Event added/updated successfully' });
  });
});

// API to add registrant
app.post('/api/registrants', [
  body('name').isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: `Validation errors. please contact event administrator.`,
        errors: errors.array()
      });
    }

    const { name, email, phone } = req.body;

    // Fetch all registrants
    const allRegistrants = await new Promise((resolve, reject) => {
      client.hgetall('registrants', (err, data) => {
        if (err) return reject(err);
        resolve(data ? Object.values(data).map(JSON.parse) : []);
      });
    });

    // Check for duplicates
    const duplicate = allRegistrants.find(r => r.email === email || r.phone === phone);
    if (duplicate) {
      return res.status(400).json({
        message: `User with this email or phone already registered. please contact event administrator.`
      });
    }

    // No duplicates => proceed
    const registrantId = `registrant:${Date.now()}`;
    client.hset('registrants', registrantId, JSON.stringify({ name, email, phone }), (err) => {
      if (err) {
        console.error('Redis error adding registrant:', err);
        return res.status(500).json({
          message: `Redis error. please contact event administrator.`,
          error: err.message
        });
      }
      console.log('Registrant added successfully:', { name, email, phone });
      res.json({ message: 'Registrant added successfully' });
    });
  } catch (error) {
    console.error('Error in /api/registrants:', error);
    res.status(500).json({ message: `Server error. please contact event administrator.`, error: error.message });
  }
});

// API to get registrants
app.get('/api/registrants', (req, res) => {
  client.hgetall('registrants', (err, registrants) => {
    if (err) {
      console.error('Error fetching registrants:', err);
      return res.status(500).json({ message: 'Redis error', error: err.message });
    }
    const registrantsArray = registrants ? Object.entries(registrants).map(([id, data]) => ({ id, ...JSON.parse(data) })) : [];
    res.json(registrantsArray);
  });
});

// API to add/update registrant
app.post('/api/registrants', [
  body('fullName').isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phoneNumber').isMobilePhone(),
  body('eventId').isString().trim().escape()
], (req, res) => {
  console.log('POST /api/registrants received:', req.body);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
  }

  const { id, fullName, email, phoneNumber, eventId } = req.body;
  client.hset('registrants', id, JSON.stringify({ fullName, email, phoneNumber, eventId }), (err) => {
    if (err) {
      console.error('Redis error adding/updating registrant:', err);
      return res.status(500).json({ message: 'Redis error', error: err.message });
    }
    console.log('Registrant added/updated successfully');
    res.status(200).json({ message: 'Registrant added/updated successfully' });
  });
});

// API to update registrant details
app.put('/api/registrants/:id', [
  body('fullName').isString().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('phoneNumber').isMobilePhone()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('Validation errors:', errors.array());
    return res.status(400).json({ message: 'Validation errors', errors: errors.array() });
  }

  const registrantId = req.params.id;
  const { fullName, email, phoneNumber, eventId } = req.body;

  client.hset('registrants', registrantId, JSON.stringify({ fullName, email, phoneNumber, eventId }), (err) => {
    if (err) {
      console.error('Redis error updating registrant:', err);
      return res.status(500).json({ message: 'Redis error', error: err.message });
    }
    console.log('Registrant updated successfully:', { fullName, email, phoneNumber });
    res.json({ message: 'Registrant updated successfully' });
  });
});

// Test Redis connection
app.get('/api/test-redis', (req, res) => {
  client.set('test-key', 'test-value', (err) => {
    if (err) {
      return res.status(500).send('Failed to connect to Redis');
    }
    client.get('test-key', (err, value) => {
      if (err) {
        return res.status(500).send('Failed to retrieve value from Redis');
      }
      res.send(`Redis connection successful: ${value}`);
    });
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});