# Microservicios

Usuarios, Productos y Pedidos separados en servicios independientes. Cada uno
tiene su propia API REST (Node.js + Express), su propia base de datos
PostgreSQL y su propio contenedor.

```
usuarios  :3001 ──> usuarios-db  (PostgreSQL)
productos :3002 ──> productos-db (PostgreSQL)
pedidos   :3003 ──> pedidos-db   (PostgreSQL)
   │
   └── valida usuario_id y producto_id llamando a las API de usuarios y productos
```

## Estructura

```
microservicios/
├── docker-compose.yml
├── desplegar.sh          # primer despliegue en Minikube (pasos 1-4)
├── iniciar.sh            # arranca/detiene Minikube y abre los puertos 3101-3103
├── k8s/
│   ├── configmaps.yaml   # init.sql de cada base de datos
│   ├── bases-datos.yaml  # PVC + Service + Deployment de cada PostgreSQL
│   └── microservicios.yaml  # Deployments (2 réplicas) + Services NodePort
├── usuarios/   (src/, tests/, init.sql, Dockerfile)
├── productos/  (src/, tests/, init.sql, Dockerfile)
└── pedidos/    (src/, tests/, init.sql, Dockerfile)
```

## Endpoints

| Servicio | Método | Ruta | Descripción |
| --- | --- | --- | --- |
| todos | GET | /health | Estado del servicio |
| todos | GET | /db-test | Prueba de conexión a su PostgreSQL |
| usuarios | GET / POST | /usuarios | Listar / crear (`nombre`, `email`) |
| usuarios | GET | /usuarios/:id | Un usuario (404 si no existe) |
| productos | GET / POST | /productos | Listar / crear (`nombre`, `precio`) |
| productos | GET | /productos/:id | Un producto (404 si no existe) |
| pedidos | GET | /pedidos, /pedidos/:id | Listar / consultar |
| pedidos | POST | /pedidos | Crear (`usuario_id`, `producto_id`, `cantidad`); se rechaza si el usuario o el producto no existen |

## Ejecutar con Docker Compose

```bash
cd microservicios
docker compose up --build -d
curl http://localhost:3001/usuarios
curl http://localhost:3002/productos
curl http://localhost:3003/pedidos
docker compose exec pedidos npm test     # pruebas (Jest + Supertest)
docker compose stop                      # detener
docker compose down -v                   # borrar también los datos
```

## Kubernetes con Minikube

### Primer despliegue

```bash
cd microservicios
./desplegar.sh          # Minikube + imágenes v1 + namespace + secret + BD + APIs
./iniciar.sh            # abre http://localhost:3101, 3102 y 3103
```

`desplegar.sh` reúne los pasos 1 a 4 de la guía. Si se prefiere hacerlo a mano:

```bash
minikube start --driver=docker
minikube image build -t usuarios:v1 ./usuarios
minikube image build -t productos:v1 ./productos
minikube image build -t pedidos:v1 ./pedidos
kubectl create namespace microservicios
kubectl create secret generic db-credentials \
  --from-literal=usuarios-user=usuarios_user --from-literal=usuarios-password=usuarios123 \
  --from-literal=productos-user=productos_user --from-literal=productos-password=productos123 \
  --from-literal=pedidos-user=pedidos_user --from-literal=pedidos-password=pedidos123 \
  -n microservicios
kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/bases-datos.yaml
kubectl apply -f k8s/microservicios.yaml
kubectl get deployments,pods,services,pvc -n microservicios
```

Para publicar una nueva versión de las imágenes: `./desplegar.sh v2`.

### Uso diario

```bash
./iniciar.sh            # inicia todo
./iniciar.sh stop       # detiene port-forwards y Minikube
```

Los Services son `NodePort` (31001, 31002, 31003), así que también se puede
acceder sin port-forward en `http://$(minikube ip):31001`, o con
`minikube service usuarios -n microservicios --url`.

### Pruebas

```bash
curl -s http://localhost:3101/health | python3 -m json.tool
curl -s http://localhost:3101/usuarios | python3 -m json.tool
curl -s http://localhost:3102/productos | python3 -m json.tool
curl -s http://localhost:3103/pedidos | python3 -m json.tool

# Pedido aceptado (usuario y producto existen)
curl -sS -X POST http://127.0.0.1:3103/pedidos \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":3,"producto_id":3,"cantidad":2}' | python3 -m json.tool

# Pedido rechazado (el producto 99 no existe)
curl -sS -X POST http://127.0.0.1:3103/pedidos \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":3,"producto_id":99,"cantidad":2}' | python3 -m json.tool
```

Recuperación ante fallos (cada API tiene 2 réplicas):

```bash
kubectl get pods -n microservicios -l app=usuarios
kubectl delete pod <nombre-del-pod> -n microservicios
kubectl get pods -n microservicios -l app=usuarios   # aparece un pod nuevo
curl -s http://localhost:3101/usuarios               # el acceso sigue funcionando
```

## Monitoreo con Prometheus y Grafana

```bash
# Helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh && ./get_helm.sh && rm get_helm.sh
helm version --short

# kube-prometheus-stack
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring --create-namespace
kubectl get pods -n monitoring

# Grafana en http://localhost:3000 (usuario admin)
kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80
# en otra terminal:
kubectl get secret -n monitoring monitoring-grafana \
  -o jsonpath="{.data.admin-password}" | base64 --decode; echo
```

En Grafana: **Dashboards → Kubernetes / Compute Resources / Namespace (Pods)**,
namespace `microservicios`.

### Prueba de carga y fallo

```bash
for i in {1..300}; do
  curl -fsS -o /dev/null http://localhost:3101/usuarios
  curl -fsS -o /dev/null http://localhost:3102/productos
  curl -fsS -o /dev/null http://localhost:3103/pedidos
done
echo "Consultas finalizadas"

# -l app=pedidos elige solo pods de la API (no el de pedidos-db)
POD=$(kubectl get pods -n microservicios -l app=pedidos \
  -o jsonpath='{.items[0].metadata.name}')
kubectl delete pod "$POD" -n microservicios
kubectl get pods -n microservicios -l app=pedidos -w
```
