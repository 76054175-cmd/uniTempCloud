jest.mock('../src/db', () => ({ query: jest.fn() }));

const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db');

const respuesta = (status) => ({ status, ok: status >= 200 && status < 300 });

beforeEach(() => {
    pool.query.mockReset();
    global.fetch = jest.fn();
});

test('GET /health responde ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ estado: 'ok', servicio: 'pedidos' });
});

test('POST /pedidos acepta si usuario y producto existen', async () => {
    fetch.mockResolvedValueOnce(respuesta(200)).mockResolvedValueOnce(respuesta(200));
    pool.query.mockResolvedValue({ rows: [{ id: 4, usuario_id: 3, producto_id: 3, cantidad: 2 }] });

    const res = await request(app).post('/pedidos').send({ usuario_id: 3, producto_id: 3, cantidad: 2 });
    expect(res.statusCode).toBe(201);
    expect(res.body.estado).toBe('aceptado');
});

test('POST /pedidos rechaza si el producto no existe', async () => {
    fetch.mockResolvedValueOnce(respuesta(200)).mockResolvedValueOnce(respuesta(404));

    const res = await request(app).post('/pedidos').send({ usuario_id: 1, producto_id: 99, cantidad: 1 });
    expect(res.statusCode).toBe(404);
    expect(res.body.estado).toBe('rechazado');
    expect(pool.query).not.toHaveBeenCalled();
});

test('POST /pedidos rechaza datos inválidos', async () => {
    const res = await request(app).post('/pedidos').send({ usuario_id: 1, producto_id: 1, cantidad: 0 });
    expect(res.statusCode).toBe(400);
});

test('POST /pedidos responde 503 si un servicio no está disponible', async () => {
    fetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const res = await request(app).post('/pedidos').send({ usuario_id: 1, producto_id: 1, cantidad: 1 });
    expect(res.statusCode).toBe(503);
});
