# Microservicios

El monolito dividido en tres servicios independientes. Cada uno tiene su propia
API REST, su propio contenedor y su propia base de datos PostgreSQL.

| Servicio | Puerto | Endpoints | Base de datos |
| --- | --- | --- | --- |
| usuarios | 3001 | /health, /usuarios | usuarios_db (contenedor usuarios-db) |
| productos | 3002 | /health, /productos | productos_db (contenedor productos-db) |
| pedidos | 3003 | /health, /pedidos | pedidos_db (contenedor pedidos-db) |

## Ejecutar

```bash
cd microservicios
docker compose config
docker compose up --build -d
curl http://localhost:3001/usuarios
curl http://localhost:3002/productos
curl http://localhost:3003/pedidos
```

Puede correr al mismo tiempo que el monolito (puerto 3000): los puertos y los
nombres de contenedor no se repiten.

## Prueba de caída de un servicio

```bash
docker stop pedidos-app
curl http://localhost:3001/health   # responde
curl http://localhost:3002/health   # responde
curl http://localhost:3003/health   # falla: connection refused
docker start pedidos-app
curl http://localhost:3003/health   # vuelve a responder
```

Solo cae Pedidos; Usuarios y Productos siguen atendiendo. En el monolito, la
misma caída habría tumbado los tres módulos.

## Ejecutar un servicio en local (sin Docker)

```bash
cd microservicios/usuarios
cp .env.example .env   # DB_HOST=localhost
npm install
npm start
```

Requiere crear antes `usuarios_db` y `usuarios_user` en el PostgreSQL local.
