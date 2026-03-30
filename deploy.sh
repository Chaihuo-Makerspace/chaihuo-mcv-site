#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building image..."
docker compose build

echo "==> Restarting service..."
docker compose up -d

echo "==> Done. Site is running at http://localhost:4321"
echo "    zh: http://localhost:4321/"
echo "    en: http://localhost:4321/en/"
