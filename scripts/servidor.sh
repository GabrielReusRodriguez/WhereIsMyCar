#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

MODO="${1:-preview}"

ip_local() {
  hostname -I 2>/dev/null | awk '{print $1}'
}

case "$MODO" in
  preview|"")
    echo "==> Construyendo la app para pruebas manuales"
    docker compose run --rm -T app npm run build

    echo
    echo "Servidor de pruebas (build de producción, PWA real):"
    echo "  Escritorio: http://localhost:4173"
    echo "  Móvil:      http://$(ip_local):4173"
    echo
    echo "Aviso: la geolocalización solo funciona en HTTPS o localhost."
    echo "En el móvil por HTTP el GPS puede estar bloqueado; para probar"
    echo "el flujo de calle usa http://localhost:4173 en el escritorio o"
    echo "el modo --dev desde localhost. La cámara sí funciona por HTTP."
    echo
    echo "Pulsa Ctrl+C para detener el servidor."
    echo
    docker compose up preview
    ;;

  --dev|dev)
    echo
    echo "Servidor de desarrollo (hot reload):"
    echo "  Escritorio: http://localhost:5173"
    echo "  Móvil:      http://$(ip_local):5173"
    echo
    echo "Pulsa Ctrl+C para detener el servidor."
    echo
    docker compose up app
    ;;

  --stop|stop)
    echo "==> Deteniendo contenedores"
    docker compose down
    ;;

  *)
    echo "Uso: $0 [--dev|--stop]" >&2
    echo "  (sin argumentos)  build de producción + preview en el puerto 4173" >&2
    echo "  --dev             servidor de desarrollo con hot reload en el 5173" >&2
    echo "  --stop            detiene los contenedores" >&2
    exit 1
    ;;
esac
