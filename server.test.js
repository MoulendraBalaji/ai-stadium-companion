import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_DB_FILE = path.join(__dirname, 'data', 'db_test.json');

describe('Express REST API Endpoints', () => {
  let server;
  let baseUrl;

  beforeAll(() => {
    // Set environment variable to test to route DB writes to db_test.json
    process.env.NODE_ENV = 'test';

    // Start Express server on a dynamically allocated free port (port 0)
    return new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    // Shutdown server and clean up test database file
    return new Promise((resolve) => {
      server.close(() => {
        try {
          if (fs.existsSync(TEST_DB_FILE)) {
            fs.unlinkSync(TEST_DB_FILE);
          }
        } catch (err) {
          console.error('Error cleaning up test DB file:', err);
        }
        resolve();
      });
    });
  });

  it('GET /api/inputs returns the default inputs successfully', async () => {
    const res = await fetch(`${baseUrl}/api/inputs`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('transport');
    expect(data).toHaveProperty('energy');
    expect(data.transport.carType).toBe('gasoline');
  });

  it('POST /api/inputs saves and returns inputs correctly', async () => {
    const newInputs = {
      transport: { carKm: 8000, carType: 'electric', transitKm: 1500, shortFlights: 1, longFlights: 0 },
      energy: { electricityKwh: 200, greenEnergy: 50, heatingFuel: 'electric', heatingAmount: 100, householdSize: 1 },
      food: { dietType: 'vegan', foodWaste: 'low' },
      shopping: { clothes: 'low', electronics: 'low', recycle: 'all' }
    };

    const res = await fetch(`${baseUrl}/api/inputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInputs)
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);

    // Verify it was written by fetching again
    const resVerify = await fetch(`${baseUrl}/api/inputs`);
    const dataVerify = await resVerify.json();
    expect(dataVerify.transport.carKm).toBe(8000);
    expect(dataVerify.transport.carType).toBe('electric');
    expect(dataVerify.energy.greenEnergy).toBe(50);
  });

  it('POST /api/inputs returns 400 bad request for invalid payloads', async () => {
    const invalidInputs = {
      transport: { carKm: -500, carType: 'gasoline' } // incomplete and negative
    };

    const res = await fetch(`${baseUrl}/api/inputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidInputs)
    });
    expect(res.status).toBe(400);
  });

  it('GET /api/actions returns logged actions list', async () => {
    const res = await fetch(`${baseUrl}/api/actions`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('POST /api/actions logs a new action, and DELETE /api/actions/:id removes it', async () => {
    const actionPayload = {
      id: 'plant-based-day',
      category: 'food',
      title: 'Eat a Plant-Based Day',
      description: 'Eat vegan meals for a day',
      co2SavedKg: 4.8,
      points: 30,
      difficulty: 'medium'
    };

    // 1. Post new action
    const resPost = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionPayload)
    });
    expect(resPost.status).toBe(201);
    const actionResult = await resPost.json();
    expect(actionResult).toHaveProperty('logId');
    const logId = actionResult.logId;

    // 2. Verify it is returned in the list
    const resList = await fetch(`${baseUrl}/api/actions`);
    const listData = await resList.json();
    expect(listData.some(a => a.logId === logId)).toBe(true);

    // 3. Delete the action
    const resDel = await fetch(`${baseUrl}/api/actions/${logId}`, {
      method: 'DELETE'
    });
    expect(resDel.status).toBe(200);

    // 4. Verify it is no longer in the list
    const resList2 = await fetch(`${baseUrl}/api/actions`);
    const listData2 = await resList2.json();
    expect(listData2.some(a => a.logId === logId)).toBe(false);
  });

  it('POST /api/actions returns 400 for invalid action data', async () => {
    const invalidAction = {
      id: 'bad-action',
      co2SavedKg: -10 // negative saved
    };

    const res = await fetch(`${baseUrl}/api/actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invalidAction)
    });
    expect(res.status).toBe(400);
  });

  it('CORS policy blocks unauthorized origin requests', async () => {
    const res = await fetch(`${baseUrl}/api/inputs`, {
      headers: { 'Origin': 'http://malicious.com' }
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.message).toBe('Blocked by CORS policy.');
  });

  it('catches JSON parser errors gracefully to prevent stack trace leaks', async () => {
    const res = await fetch(`${baseUrl}/api/inputs`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      },
      body: '{invalid-json-format'
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe('Invalid JSON payload format.');
  });

  it('GET /api/nonexistent-route returns 404', async () => {
    const res = await fetch(`${baseUrl}/api/nonexistent-route`);
    expect(res.status).toBe(404);
  });
});
