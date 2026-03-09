const request = require('supertest');
const { app } = require('../src/app');

describe('Attendance API', () => {
  it('should return unauthorized when no token provided', async () => {
    const res = await request(app)
      .post('/api/attendance/scan-qr')
      .send({});

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

