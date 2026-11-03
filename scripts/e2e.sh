#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Tests E2E con Playwright (Docker)"
docker compose run --rm -T e2e

echo "==> E2E correctos"
