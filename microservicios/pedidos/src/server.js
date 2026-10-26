const app = require('./app');
const pool = require('./db');

const PORT = Number(process.env.PORT || 3003);

const server = app.listen(PORT, () => {
    console.log(`Servicio pedidos ejecutándose en el puerto ${PORT}`);
});

// Cierre ordenado cuando Docker o Kubernetes detienen el contenedor
function cerrar(senal) {
    console.log(`${senal} recibido, cerrando servicio pedidos...`);
    server.close(() => {
        pool.end().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(0), 5000).unref();
}

process.on('SIGTERM', () => cerrar('SIGTERM'));
process.on('SIGINT', () => cerrar('SIGINT'));
