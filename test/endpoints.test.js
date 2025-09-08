const request = require('supertest');
const app = require('../app');

describe('Pruebas de endpoints principales', () => {
  it('GET /api/products debe responder con status 200', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
  });

  it('GET /api/carts debe responder con status 200', async () => {
    const res = await request(app).get('/api/carts');
    expect(res.statusCode).toBe(200);
  });

  it('GET / debe renderizar la vista principal', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<!DOCTYPE html');
  });

  it('GET /api/users debe responder con status 200', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
  });

  it('POST /api/sessions/forgot-password debe responder con error si no hay email', async () => {
    const res = await request(app).post('/api/sessions/forgot-password').send({});
    expect(res.statusCode).toBe(404);
  });
});
