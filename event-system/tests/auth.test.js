const request = require('supertest');
const { app } = require('../src/app');

describe('Auth API', () => {
  it('should return validation error for invalid register body', async () => {
    const res = await request(app).post('/api/auth/register').send({
      full_name: '',
      email: 'not-an-email',
      password: '123'
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation error');
  });

  it('should return validation error for invalid login body', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'not-an-email',
      password: ''
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation error');
  });
});

