const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ estado: 'ok', servicio: 'usuarios' });
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

app.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM usuarios ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar usuarios' });
    }
});

app.get('/usuarios/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El id debe ser un entero positivo' });
    }
    try {
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el usuario' });
    }
});

app.post('/usuarios', async (req, res) => {
    const { nombre, email } = req.body || {};
    if (!nombre || !email) {
        return res.status(400).json({ error: 'nombre y email son obligatorios' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
            [nombre, email]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        if (error.code === '23505') {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }
        console.error(error);
        res.status(500).json({ error: 'Error al crear el usuario' });
    }
});

module.exports = app;
