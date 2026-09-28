#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building image..."
docker compose build

echo "==> Stopping previous containers (including interrupted Compose recreates)..."
# An interrupted 'up' can leave a temporary <container-id>_<project>-<service>-1
# container. A later 'up' tries to reuse that name and fails with a conflict.
# Keep the bind-mounted ./data/live directory: never pass --volumes here.
docker compose down --remove-orphans

echo "==> Starting service..."
docker compose up -d --wait --wait-timeout 60

echo "==> Done. Site is running at http://localhost:4321"
echo "    zh: http://localhost:4321/"
echo "    en: http://localhost:4321/en/"
