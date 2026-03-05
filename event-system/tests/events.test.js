const request = require('supertest');
const { app } = require('../src/app');

describe('Events API', () => {
  it('should list events with pagination', async () => {
    const res = await request(app).get('/api/events?page=1&limit=5');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toMatchObject({ page: 1, limit: 5 });
  });
});

