# WhereIsMyCar

WhereIsMyCar es una aplicación web progresiva (PWA), pensada primero para móviles, que ayuda a recordar dónde está aparcado el coche. Permite guardar los datos de un aparcamiento y consultarlos al volver; no requiere crear una cuenta ni enviar la ubicación o las fotos a un servidor.

## Cómo funciona

Al abrir la aplicación, puedes registrar un aparcamiento en un parking o en la calle:

- **Parking:** indica la planta y la plaza; la zona es opcional.
- **Calle:** elige si quieres guardar solo la dirección, solo la ubicación GPS o ambas. La dirección requiere calle y número, y la ciudad es opcional. Puedes indicar si el aparcamiento es de pago.
- **Foto:** en cualquiera de los dos tipos puedes añadir una foto del coche. Es opcional y puedes previsualizarla o cambiarla antes de guardar.

La hora se guarda automáticamente. Mientras el coche está aparcado, la aplicación muestra el registro activo. Si guardaste coordenadas GPS, puedes abrirlas en Google Maps mediante un enlace que tú decides pulsar. Para terminar, selecciona **«He recogido el coche»** y confirma: la aplicación vuelve a la pantalla de inicio. Los registros anteriores se conservan en el dispositivo, pero no se muestran como historial.

## Privacidad y almacenamiento

Los aparcamientos, los eventos de recogida y las fotos se guardan en el navegador del dispositivo mediante IndexedDB. La preferencia de idioma se guarda en localStorage. No hay cuenta, backend ni sincronización entre dispositivos; borrar los datos del navegador puede eliminar los datos guardados.

La aplicación no envía datos del usuario a servicios externos. La única salida prevista es el enlace a Google Maps, que se abre externamente solo cuando el usuario lo solicita.

## Idiomas y uso sin conexión

La interfaz está disponible en castellano y catalán. Puedes cambiar el idioma con el selector de la aplicación o forzarlo mediante `?lang=es` o `?lang=ca`; la selección se recuerda en el dispositivo.

La PWA puede instalarse en dispositivos compatibles y, una vez cargada, está preparada para funcionar sin conexión. La geolocalización del navegador requiere un contexto seguro (HTTPS o `localhost`).

## Desarrollo

El proyecto sigue una configuración **Docker-only**: no hace falta instalar Node.js ni npm en el host; se necesita Docker y Git.

Para iniciar el servidor de desarrollo en `http://localhost:5173`:

```bash
docker compose up
```

Los comandos de npm se ejecutan dentro del contenedor:

```bash
docker compose run --rm app npm install
docker compose run --rm app npm run lint
docker compose run --rm app npm run test
docker compose run --rm app npm run build
```

También están disponibles estos atajos:

```bash
./scripts/test.sh    # lint, tests unitarios y build
./scripts/e2e.sh     # tests end-to-end con Playwright
./scripts/check.sh   # verificaciones anteriores, incluidas las E2E
```

Los tests end-to-end se ejecutan en el servicio Docker `e2e`, que incluye los navegadores de Playwright. Para probar manualmente el build de producción con la PWA en `http://localhost:4173`, ejecuta `./scripts/servidor.sh`; usa `./scripts/servidor.sh --dev` para desarrollo y `./scripts/servidor.sh --stop` para detener los contenedores.

## Tecnologías

- React 19 y TypeScript
- Vite y `vite-plugin-pwa`
- IndexedDB para aparcamientos y fotos; localStorage para la preferencia de idioma
- `react-i18next` para castellano y catalán
- Vitest y Playwright para pruebas
- Cloudflare Workers Static Assets para el despliegue

## Despliegue

La aplicación se puede desplegar como assets estáticos en Cloudflare Workers. Para construir y publicar, con las credenciales de Cloudflare configuradas para Wrangler:

```bash
docker compose run --rm app npm run build
docker compose run --rm app npm run deploy
```

Para comprobar el despliegue sin publicarlo:

```bash
docker compose run --rm app npm run deploy:dry-run
```

El alojamiento sirve la aplicación; los datos de cada usuario continúan almacenándose localmente en su navegador.

## Especificación

Los requisitos funcionales y técnicos completos están en [`specs.md`](specs.md).
