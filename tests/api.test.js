const { test, describe } = require('node:test');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:5000';

describe('BarterHub Europa API Test Suite', () => {
  let authToken = '';
  let testUserId = '';

  test('1. Server Health Check returns healthy status', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.status, 'healthy');
    assert.strictEqual(data.platform, 'BarterHub Europa');
    assert.strictEqual(data.version, '1.1.0');
    assert.strictEqual(data.database, 'connected');
  });

  test('2. GET /api/items returns available items and pagination', async () => {
    const res = await fetch(`${BASE_URL}/api/items?limit=6`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.items));
    assert.ok(data.items.length > 0);
    assert.ok(data.pagination);
    assert.strictEqual(data.pagination.limit, 6);
  });

  test('3. GET /api/items with European location filter works', async () => {
    const res = await fetch(`${BASE_URL}/api/items?location=Paris`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.items));
    if (data.items.length > 0) {
      assert.ok(data.items[0].location.toLowerCase().includes('paris'));
    }
  });

  test('4. POST /api/auth/login authenticates demo European user', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'julien@barterhub.eu',
        password: 'password123'
      })
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.email, 'julien@barterhub.eu');
    authToken = data.token;
    testUserId = data.user._id;
  });

  test('5. GET /api/auth/me returns current user with valid token', async () => {
    assert.ok(authToken, 'Auth token should exist from previous test');
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, 'julien@barterhub.eu');
  });

  test('6. GET /api/items/user/favorites returns user wishlist', async () => {
    assert.ok(authToken);
    const res = await fetch(`${BASE_URL}/api/items/user/favorites`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.items));
  });

  test('7. GET /api/users/:id/reviews returns user review history', async () => {
    assert.ok(testUserId);
    const res = await fetch(`${BASE_URL}/api/users/${testUserId}/reviews`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.reviews));
  });

  test('8. GET /api/trades returns trades for authenticated user', async () => {
    assert.ok(authToken);
    const res = await fetch(`${BASE_URL}/api/trades`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.trades));
  });
});
