jest.mock('../src/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

beforeEach(() => pool.query.mockReset());

test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', servicio: 'productos' });
});

test('GET /productos devuelve la lista', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, nombre: 'Laptop', precio: '2500.00' }] });
    const res = await request(app).get('/productos');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
});

test('GET /productos/:id devuelve 404 si no existe', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/productos/99');
    expect(res.statusCode).toBe(404);
});

test('POST /productos rechaza precio inválido', async () => {
    const res = await request(app).post('/productos').send({ nombre: 'Monitor', precio: 'abc' });
    expect(res.statusCode).toBe(400);
});
