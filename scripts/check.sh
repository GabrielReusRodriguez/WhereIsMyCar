#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/test.sh
bash scripts/e2e.sh

echo "==> Verificación completa correcta"
