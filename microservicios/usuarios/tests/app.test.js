jest.mock('../src/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

beforeEach(() => pool.query.mockReset());

test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', servicio: 'usuarios' });
});

test('GET /usuarios devuelve la lista', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, nombre: 'Ana Torres', email: 'ana@correo.com' }] });
    const res = await request(app).get('/usuarios');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(1);
});

test('GET /usuarios/:id devuelve 404 si no existe', async () => {
    pool.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/usuarios/99');
    expect(res.statusCode).toBe(404);
});

test('POST /usuarios valida campos obligatorios', async () => {
    const res = await request(app).post('/usuarios').send({ nombre: 'Sin email' });
    expect(res.statusCode).toBe(400);
});
