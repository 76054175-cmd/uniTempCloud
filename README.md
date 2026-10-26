# Mini Proyecto: Arquitectura monolítica y microservicios

Autor: Luis Alberto Tecsi Huallpa

API REST de Usuarios, Productos y Pedidos construida con Node.js, Express y
PostgreSQL, probada con Jest + Supertest, en dos versiones: monolito y
microservicios. Los microservicios se despliegan en Kubernetes (Minikube) y se
monitorean con Prometheus y Grafana.

```
MONOLITO ───────┐
                ├──> Docker ──> Git / GitHub ──> Kubernetes ──> Prometheus / Grafana
MICROSERVICIOS ─┘
```

| Carpeta | Contenido |
| --- | --- |
| `monolito/` | Una sola API y una sola base de datos (puerto 3000) |
| `microservicios/` | Tres API y tres bases de datos (puertos 3001-3003), manifiestos de Kubernetes y scripts de despliegue. Ver [microservicios/README.md](microservicios/README.md) |

## Kubernetes (resumen)

```bash
cd microservicios
./desplegar.sh      # primer despliegue en Minikube
./iniciar.sh        # http://localhost:3101, 3102, 3103
./iniciar.sh stop
```

## Monolito

### Ejecutar con Docker

```bash
cd monolito
docker compose up --build -d
curl http://localhost:3000/usuarios
docker compose exec app npm test
```

Para recrear la base desde `init.sql`: `docker compose down -v`.

### Ejecutar en local

```bash
cd monolito
cp .env.example .env
npm install
npm start
npm test
```

### Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | /health | Estado del servicio |
| GET | /db-test | Prueba de conexión a PostgreSQL |
| GET | /usuarios | Lista de usuarios |
| GET | /productos | Lista de productos |
| GET | /pedidos | Lista de pedidos |
