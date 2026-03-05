const request = require('supertest');
const { app } = require('../src/app');

describe('Attendance API', () => {
  it('should return validation error when qr_token is missing', async () => {
    const res = await request(app)
      .post('/api/attendance/checkin')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

