import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

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

// REST API routes

// GET calculator inputs
app.get('/api/inputs', (req, res) => {
  const db = readDb();
  res.json(db.inputs);
});

// POST calculator inputs
app.post('/api/inputs', (req, res) => {
  const db = readDb();
  db.inputs = req.body;
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
  const db = readDb();
  const newAction = req.body;
  
  if (!newAction.logId) {
    newAction.logId = Date.now().toString();
  }
  if (!newAction.timestamp) {
    newAction.timestamp = new Date().toLocaleDateString();
  }

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

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
