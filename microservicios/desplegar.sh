#!/usr/bin/env bash
# Primer despliegue en Minikube (pasos 1 a 4 de la guía) en un solo comando.
# Es idempotente: se puede volver a ejecutar sin errores.
# Uso: ./desplegar.sh [version]     (por defecto v1)
set -Eeuo pipefail

cd "$(dirname "$0")"

NAMESPACE="microservicios"
VERSION="${1:-v1}"
SERVICES=(usuarios productos pedidos)

command -v minikube >/dev/null || { echo "Error: falta instalar Minikube."; exit 1; }
command -v kubectl >/dev/null || { echo "Error: falta instalar kubectl."; exit 1; }

# Liberar recursos de Docker Compose si estaba levantado
if command -v docker >/dev/null && docker compose ps -q 2>/dev/null | grep -q .; then
    echo "==> Deteniendo Docker Compose"
    docker compose stop
fi

echo "==> Paso 1: iniciando Minikube"
minikube status >/dev/null 2>&1 || minikube start --driver=docker
kubectl get nodes

echo "==> Paso 2: construyendo imágenes ${VERSION} dentro de Minikube"
for service in "${SERVICES[@]}"; do
    minikube image build -t "${service}:${VERSION}" "./${service}"
done

echo "==> Paso 3: namespace, credenciales y ConfigMaps"
kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic db-credentials \
    --from-literal=usuarios-user=usuarios_user \
    --from-literal=usuarios-password=usuarios123 \
    --from-literal=productos-user=productos_user \
    --from-literal=productos-password=productos123 \
    --from-literal=pedidos-user=pedidos_user \
    --from-literal=pedidos-password=pedidos123 \
    -n "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -

kubectl apply -f k8s/configmaps.yaml
kubectl apply -f k8s/bases-datos.yaml

echo "==> Esperando a las bases de datos"
for service in "${SERVICES[@]}"; do
    kubectl rollout status "deployment/${service}-db" -n "$NAMESPACE" --timeout=300s
done

echo "==> Paso 4: desplegando microservicios"
kubectl apply -f k8s/microservicios.yaml
if [[ "$VERSION" != "v1" ]]; then
    for service in "${SERVICES[@]}"; do
        kubectl set image "deployment/${service}" "${service}=${service}:${VERSION}" -n "$NAMESPACE"
    done
fi
for service in "${SERVICES[@]}"; do
    kubectl rollout status "deployment/${service}" -n "$NAMESPACE" --timeout=300s
done

kubectl get deployments,pods,services,pvc -n "$NAMESPACE"
echo
echo "Listo. Ahora ejecuta ./iniciar.sh para abrir los accesos en los puertos 3101-3103."
