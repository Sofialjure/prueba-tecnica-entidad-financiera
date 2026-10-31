#!/usr/bin/env bash
# Publishes the current code on the Azure VM (ADR-0006).
# Builds the images on this computer, copies them over SSH and restarts the stack there,
# so the small server never has to compile. Run it from the repository root:
#   ./deploy/azure/deploy.sh
set -euo pipefail

HOST="${AZURE_HOST:-azureuser@entidad-financiera-sofia.northcentralus.cloudapp.azure.com}"
KEY="${AZURE_SSH_KEY:-$HOME/.ssh/entidad-financiera-azure}"
REMOTE_DIR=/opt/entidad-financiera
COMPOSE="docker compose -f docker-compose.yml -f docker-compose.azure.yml"

echo "1/4 Construyendo las imágenes del backend y del frontend..."
docker compose build backend frontend

echo "2/4 Copiando las imágenes al servidor (puede tardar varios minutos)..."
docker save entidad-financiera-backend:latest entidad-financiera-frontend:latest \
  | gzip | ssh -i "$KEY" "$HOST" 'gunzip | docker load'

echo "3/4 Copiando la configuración de Docker Compose..."
scp -q -i "$KEY" docker-compose.yml deploy/azure/docker-compose.azure.yml deploy/azure/Caddyfile "$HOST:$REMOTE_DIR/"

echo "4/4 Reiniciando la aplicación en el servidor..."
# The database password lives only in the server's .env; it is created once and never copied
ssh -i "$KEY" "$HOST" "cd $REMOTE_DIR && \
  if [ ! -f .env ]; then umask 077; printf 'DB_NAME=entidad_financiera\nDB_USERNAME=entidad_financiera\nDB_PASSWORD=%s\n' \"\$(openssl rand -hex 16)\" > .env; fi && \
  $COMPOSE up -d --no-build --wait && $COMPOSE ps"

echo "Listo: https://${HOST#*@}"
