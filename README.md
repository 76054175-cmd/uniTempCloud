# Mini Proyecto: Arquitectura monolítica y microservicios

Autor: Luis Alberto Tecsi Huallpa

API REST de Usuarios, Productos y Pedidos construida con Node.js, Express y
PostgreSQL, probada con Jest + Supertest y ejecutada con Docker Compose.

## Ejecutar con Docker

```bash
cd monolito
docker compose up --build -d
curl http://localhost:3000/usuarios
docker compose exec app npm test
```

Para recrear la base desde `init.sql`: `docker compose down -v`.

## Ejecutar en local

```bash
cd monolito
cp .env.example .env
npm install
npm start
npm test
```

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | /health | Estado del servicio |
| GET | /db-test | Prueba de conexión a PostgreSQL |
| GET | /usuarios | Lista de usuarios |
| GET | /productos | Lista de productos |
| GET | /pedidos | Lista de pedidos |
