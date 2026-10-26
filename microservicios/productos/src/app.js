const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ estado: 'ok', servicio: 'productos' });
});

app.get('/db-test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ estado: 'ok', mensaje: 'Conexión con PostgreSQL correcta', fecha: result.rows[0].now });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: 'error', mensaje: 'No se pudo conectar con PostgreSQL' });
    }
});

app.get('/productos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM productos ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar productos' });
    }
});

app.get('/productos/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El id debe ser un entero positivo' });
    }
    try {
        const result = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el producto' });
    }
});

app.post('/productos', async (req, res) => {
    const { nombre, precio } = req.body || {};
    const valor = Number(precio);
    if (!nombre || !Number.isFinite(valor) || valor < 0) {
        return res.status(400).json({ error: 'nombre y precio (>= 0) son obligatorios' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO productos (nombre, precio) VALUES ($1, $2) RETURNING *',
            [nombre, valor]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear el producto' });
    }
});

module.exports = app;
