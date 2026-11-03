#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Lint"
docker compose run --rm -T app npm run lint

echo "==> Tests unitarios"
docker compose run --rm -T app npm run test

echo "==> Build de producción"
docker compose run --rm -T app npm run build

echo "==> Todo correcto"
