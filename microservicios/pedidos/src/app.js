const express = require('express');
const pool = require('./db');

const app = express();

app.use(express.json());

const USUARIOS_URL = process.env.USUARIOS_URL || 'http://localhost:3001';
const PRODUCTOS_URL = process.env.PRODUCTOS_URL || 'http://localhost:3002';

// Consulta otro microservicio: true si existe, false si responde 404
async function existeRecurso(url) {
    const respuesta = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (respuesta.status === 404) return false;
    if (!respuesta.ok) throw new Error(`Respuesta ${respuesta.status} de ${url}`);
    return true;
}

app.get('/health', (req, res) => {
    res.json({ estado: 'ok', servicio: 'pedidos' });
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

app.get('/pedidos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM pedidos ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar pedidos' });
    }
});

app.get('/pedidos/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'El id debe ser un entero positivo' });
    }
    try {
        const result = await pool.query('SELECT * FROM pedidos WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el pedido' });
    }
});

// Crea un pedido solo si el usuario y el producto existen en sus servicios
app.post('/pedidos', async (req, res) => {
    const usuarioId = Number(req.body?.usuario_id);
    const productoId = Number(req.body?.producto_id);
    const cantidad = Number(req.body?.cantidad);

    if (![usuarioId, productoId, cantidad].every((n) => Number.isInteger(n) && n > 0)) {
        return res.status(400).json({
            estado: 'rechazado',
            error: 'usuario_id, producto_id y cantidad deben ser enteros positivos'
        });
    }

    try {
        if (!(await existeRecurso(`${USUARIOS_URL}/usuarios/${usuarioId}`))) {
            return res.status(404).json({ estado: 'rechazado', error: `El usuario ${usuarioId} no existe` });
        }
        if (!(await existeRecurso(`${PRODUCTOS_URL}/productos/${productoId}`))) {
            return res.status(404).json({ estado: 'rechazado', error: `El producto ${productoId} no existe` });
        }
    } catch (error) {
        console.error(error);
        return res.status(503).json({
            estado: 'rechazado',
            error: 'No se pudo verificar el usuario o el producto con sus servicios'
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO pedidos (usuario_id, producto_id, cantidad) VALUES ($1, $2, $3) RETURNING *',
            [usuarioId, productoId, cantidad]
        );
        res.status(201).json({ estado: 'aceptado', pedido: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ estado: 'rechazado', error: 'Error al registrar el pedido' });
    }
});

module.exports = app;
