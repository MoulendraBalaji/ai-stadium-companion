import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security response headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; script-src 'self' 'unsafe-inline';");
  next();
});

// Rate limiting configuration to prevent DoS attacks
const ipLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100; // max 100 requests per IP per window

function rateLimiter(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    return next();
  }
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!ipLimits.has(ip)) {
    ipLimits.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  const limit = ipLimits.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }

  limit.count++;
  if (limit.count > MAX_REQUESTS) {
    return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
  }
  next();
}

// Apply rate limiter to API routes
app.use('/api', rateLimiter);

// Configure CORS securely - restrict in production, allow only localhost in development
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5000'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin requests (e.g. fetch from same server) or localhost during dev
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS policy'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));

// Limit payload size to 10kb to prevent Denial of Service (DoS) via huge payload memory exhaustion
app.use(express.json({ limit: '10kb' }));

const DB_DIR = path.join(__dirname, 'data');
// Support a test database file for Vitest unit tests to avoid overwriting production data
const DB_FILE = process.env.NODE_ENV === 'test'
  ? path.join(DB_DIR, 'db_test.json')
  : path.join(DB_DIR, 'db.json');

// Default initial database layout
const DEFAULT_DB = {
  inputs: {
    transport: { carKm: 12000, carType: 'gasoline', transitKm: 2500, shortFlights: 2, longFlights: 1 },
    energy: { electricityKwh: 320, greenEnergy: 15, heatingFuel: 'gas', heatingAmount: 350, householdSize: 2 },
    food: { dietType: 'average', foodWaste: 'medium' },
    shopping: { clothes: 'medium', electronics: 'medium', recycle: 'some' }
  },
  actions: []
};

// Initialize DB if not present
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR);
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
  }
}

// Read database file
function readDb() {
  try {
    initDb();
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return DEFAULT_DB;
  }
}

// Write to database file
function writeDb(data) {
  try {
    initDb();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
}

// Input Sanitization and XSS Prevention
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>]/g, '');
}

// Validate structure and data types of inputs payload
function validateInputs(inputs) {
  if (!inputs || typeof inputs !== 'object') return false;

  const { transport, energy, food, shopping } = inputs;
  if (!transport || typeof transport !== 'object') return false;
  if (!energy || typeof energy !== 'object') return false;
  if (!food || typeof food !== 'object') return false;
  if (!shopping || typeof shopping !== 'object') return false;

  // Transport validations
  if (typeof transport.carKm !== 'number' || transport.carKm < 0) return false;
  const allowedCarTypes = ['gasoline', 'diesel', 'hybrid', 'electric'];
  if (!allowedCarTypes.includes(transport.carType)) return false;
  if (typeof transport.transitKm !== 'number' || transport.transitKm < 0) return false;
  if (typeof transport.shortFlights !== 'number' || transport.shortFlights < 0) return false;
  if (typeof transport.longFlights !== 'number' || transport.longFlights < 0) return false;

  // Energy validations
  if (typeof energy.electricityKwh !== 'number' || energy.electricityKwh < 0) return false;
  if (typeof energy.greenEnergy !== 'number' || energy.greenEnergy < 0 || energy.greenEnergy > 100) return false;
  const allowedHeating = ['gas', 'oil', 'electric', 'none'];
  if (!allowedHeating.includes(energy.heatingFuel)) return false;
  if (typeof energy.heatingAmount !== 'number' || energy.heatingAmount < 0) return false;
  if (typeof energy.householdSize !== 'number' || energy.householdSize < 1) return false;

  // Food validations
  const allowedDiets = ['meat-heavy', 'average', 'low-meat', 'vegetarian', 'vegan'];
  if (!allowedDiets.includes(food.dietType)) return false;
  const allowedWaste = ['low', 'medium', 'high'];
  if (!allowedWaste.includes(food.foodWaste)) return false;

  // Shopping validations
  const allowedShopping = ['low', 'medium', 'high'];
  if (!allowedShopping.includes(shopping.clothes)) return false;
  if (!allowedShopping.includes(shopping.electronics)) return false;
  const allowedRecycle = ['none', 'some', 'all'];
  if (!allowedRecycle.includes(shopping.recycle)) return false;

  return true;
}

// Validate structure and data types of action logs payload
function validateAction(action) {
  if (!action || typeof action !== 'object') return false;
  if (typeof action.id !== 'string' || !action.id) return false;
  if (typeof action.category !== 'string' || !action.category) return false;
  if (typeof action.title !== 'string' || !action.title) return false;
  if (typeof action.description !== 'string') return false;
  if (typeof action.co2SavedKg !== 'number' || action.co2SavedKg < 0) return false;
  if (typeof action.points !== 'number' || action.points < 0) return false;
  const allowedDiff = ['easy', 'medium', 'hard'];
  if (!allowedDiff.includes(action.difficulty)) return false;
  return true;
}

// REST API routes

// GET calculator inputs
app.get('/api/inputs', (req, res) => {
  const db = readDb();
  res.json(db.inputs);
});

// POST calculator inputs
app.post('/api/inputs', (req, res) => {
  if (!validateInputs(req.body)) {
    return res.status(400).json({ success: false, message: 'Invalid input payload structure or types.' });
  }

  const db = readDb();
  db.inputs = {
    transport: {
      carKm: req.body.transport.carKm,
      carType: sanitizeString(req.body.transport.carType),
      transitKm: req.body.transport.transitKm,
      shortFlights: req.body.transport.shortFlights,
      longFlights: req.body.transport.longFlights
    },
    energy: {
      electricityKwh: req.body.energy.electricityKwh,
      greenEnergy: req.body.energy.greenEnergy,
      heatingFuel: sanitizeString(req.body.energy.heatingFuel),
      heatingAmount: req.body.energy.heatingAmount,
      householdSize: req.body.energy.householdSize
    },
    food: {
      dietType: sanitizeString(req.body.food.dietType),
      foodWaste: sanitizeString(req.body.food.foodWaste)
    },
    shopping: {
      clothes: sanitizeString(req.body.shopping.clothes),
      electronics: sanitizeString(req.body.shopping.electronics),
      recycle: sanitizeString(req.body.shopping.recycle)
    }
  };

  if (writeDb(db)) {
    res.json({ success: true, message: 'Inputs saved successfully.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to write data.' });
  }
});

// GET logged actions
app.get('/api/actions', (req, res) => {
  const db = readDb();
  res.json(db.actions || []);
});

// POST log action
app.post('/api/actions', (req, res) => {
  if (!validateAction(req.body)) {
    return res.status(400).json({ success: false, message: 'Invalid action payload structure or types.' });
  }

  const db = readDb();
  const newAction = {
    id: sanitizeString(req.body.id),
    category: sanitizeString(req.body.category),
    title: sanitizeString(req.body.title),
    description: sanitizeString(req.body.description),
    co2SavedKg: req.body.co2SavedKg,
    points: req.body.points,
    difficulty: sanitizeString(req.body.difficulty),
    logId: req.body.logId ? sanitizeString(req.body.logId) : Date.now().toString(),
    timestamp: req.body.timestamp ? sanitizeString(req.body.timestamp) : new Date().toLocaleDateString()
  };

  db.actions = db.actions || [];
  db.actions.unshift(newAction); // prepend new action logs
  
  if (writeDb(db)) {
    res.status(201).json(newAction);
  } else {
    res.status(500).json({ success: false, message: 'Failed to save action log.' });
  }
});

// DELETE logged action by logId
app.delete('/api/actions/:id', (req, res) => {
  const db = readDb();
  const logId = req.params.id;

  db.actions = db.actions || [];
  const initialCount = db.actions.length;
  db.actions = db.actions.filter(item => item.logId !== logId);

  if (db.actions.length === initialCount) {
    return res.status(404).json({ success: false, message: 'Action log not found.' });
  }

  if (writeDb(db)) {
    res.json({ success: true, message: 'Action log deleted successfully.' });
  } else {
    res.status(500).json({ success: false, message: 'Failed to delete action log.' });
  }
});

// Serve static built React assets in production
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all handler for SPA and undefined API routes
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    res.status(404).json({ error: 'API endpoint not found' });
  } else {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

// Custom error handling middleware to catch JSON parsing errors and prevent server stack leaks
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ success: false, message: 'Invalid JSON payload format.' });
  }
  if (err.message === 'Blocked by CORS policy') {
    return res.status(403).json({ success: false, message: 'Blocked by CORS policy.' });
  }
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// Only listen when not in a test environment to allow dynamic testing ports
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Express server running on port ${PORT}`);
  });
}

export default app;
