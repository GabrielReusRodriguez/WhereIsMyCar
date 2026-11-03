# specs.md — WhereIsMyCar

Especificación funcional y técnica de la web app **WhereIsMyCar**: registrar dónde está aparcado el coche, con un único registro activo, almacenamiento 100 % local y uso mobile-first.

## 1. Visión

El usuario aparca el coche, abre la app, registra la ubicación (parking o calle), opcionalmente hace una foto del coche y guarda. Mientras el coche sigue aparcado, la app muestra el registro activo con un enlace a Google Maps si es calle. Al recoger el coche, pulsa "He recogido el coche" y el registro y la foto se eliminan.

## 2. Requisitos funcionales

### RF-01 — Registrar aparcamiento en parking

- Campos obligatorios: **planta** y **plaza**.
- Campo opcional: **zona**.
- La **hora de aparcamiento** es la del momento de guardar el registro (automática, no editable).
- Requiere una pantalla de entrada con selector de tipo: "Parking" o "Calle".

### RF-02 — Registrar aparcamiento en la calle

- Campos obligatorios: **calle**, **número** y **ciudad**.
- **Coordenadas GPS**: botón que solicita `navigator.geolocation` y guarda `lat`/`lng`. Debe mostrar estado de carga y errores (permiso denegado, no disponible, timeout).
- **Enlace a Google Maps**: visible en el registro activo, abre `https://www.google.com/maps?q=<lat>,<lng>` en pestaña nueva.
- **Aparcamiento de pago**: selector sí/no (obligatorio, por defecto "no").
- La **hora de aparcamiento** es la del momento de guardar el registro (automática, no editable).

### RF-03 — Foto del coche

- Disponible en ambos tipos (parking y calle), **opcional**.
- Captura mediante `<input type="file" accept="image/*" capture="environment">` para abrir la cámara del teléfono.
- Preview antes de guardar; posibilidad de reemplazar o eliminar la foto.
- Se guarda como `Blob` en IndexedDB (no en `localStorage`), asociada al registro activo.

### RF-04 — Vista del aparcamiento activo

- Si existe un registro, la app muestra directamente sus datos: tipo, hora, campos correspondientes, foto si la hay y, en calle, enlace a Google Maps.
- La hora se muestra formateada según el locale activo (`es` o `ca`).

### RF-05 — Recoger el coche

- Botón "He recogido el coche" en la vista del registro activo.
- Pide confirmación antes de borrar.
- Al confirmar: elimina el registro de `localStorage` y el Blob de IndexedDB, y vuelve a la pantalla de entrada.

### RF-06 — Un único aparcamiento

- No existe historial ni listado. Guardar un registro sustituye al anterior (la UI solo permite guardar cuando no hay registro activo).
- No hay backend ni sincronización.

### RF-07 — Idiomas castellano y catalán

- Toda la interfaz está traducida a `es` y `ca`.
- Idioma inicial: el del navegador si es `ca`, en caso contrario `es`.
- Selector de idioma visible y persistido en `localStorage`.

### RF-08 — Persistencia local y offline

- Todos los datos residen en el dispositivo.
- El registro sobrevive a recargas y reinicios del navegador.
- La app funciona sin conexión una vez cargada (PWA con service worker).

## 3. Modelo de datos

Un único registro bajo la clave `whereismycar.aparcamiento` en `localStorage`:

```ts
type TipoAparcamiento = "parking" | "calle";

type AparcamientoBase = {
  id: "activo";
  tipo: TipoAparcamiento;
  guardadoEn: number;          // epoch ms, hora de aparcamiento
  fotoId?: string;             // clave del Blob en IndexedDB
};

type AparcamientoParking = AparcamientoBase & {
  tipo: "parking";
  planta: string;
  zona?: string;
  plaza: string;
};

type AparcamientoCalle = AparcamientoBase & {
  tipo: "calle";
  calle: string;
  numero: string;
  ciudad: string;
  lat: number;
  lng: number;
  dePago: boolean;
};

type Aparcamiento = AparcamientoParking | AparcamientoCalle;
```

Foto: IndexedDB, base `whereismycar`, store `fotos`, clave `id` del registro (`"activo"`), valor `{ id: string; blob: Blob; tipoMime: string }`.

La preferencia de idioma se guarda en `localStorage` bajo `whereismycar.idioma`.

## 4. Flujos de uso

### Guardar en parking

1. Pantalla de entrada → "Parking".
2. Rellenar planta, zona (opcional) y plaza.
3. Adjuntar foto (opcional).
4. Guardar → se persiste el registro con `guardadoEn = Date.now()`.
5. Se muestra la vista del aparcamiento activo.

### Guardar en la calle

1. Pantalla de entrada → "Calle".
2. Rellenar calle, número y ciudad.
3. Pulsar "Usar mi ubicación" → se obtienen coordenadas (obligatorias para guardar).
4. Indicar si es de pago.
5. Adjuntar foto (opcional).
6. Guardar → se persiste con `guardadoEn = Date.now()`.
7. Vista activa con enlace "Abrir en Google Maps".

### Recoger el coche

1. Vista activa → "He recogido el coche".
2. Confirmación.
3. Borrado de `localStorage` + Blob de IndexedDB.
4. Vuelta a la pantalla de entrada.

## 5. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-01 | Mobile-first: diseño desde 360 px de ancho, táctil, una mano, safe-areas. |
| RNF-02 | PWA instalable con manifest, iconos y service worker; funciona offline. |
| RNF-03 | Sin componentes ni APIs deprecadas (React moderno, APIs vigentes de MDN). |
| RNF-04 | Cero llamadas de red con datos del usuario. Sin backend. |
| RNF-05 | i18n completa en `es` y `ca`; sin strings hardcodeadas. |
| RNF-06 | Accesibilidad básica: labels asociados, foco visible, contraste AA, botones ≥ 44 px. |
| RNF-07 | TypeScript estricto; lint y build sin errores ni warnings. |
| RNF-08 | Rendimiento: carga inicial ligera, sin dependencias innecesarias. |

## 6. Entorno y despliegue

### Docker-only

- El host solo necesita Docker y git. **No se instala nada en el host.**
- Desarrollo: `docker compose up` (Vite en `0.0.0.0:5173`).
- Cualquier comando se ejecuta con `docker compose run --rm app <comando>`: instalación de dependencias, lint, tests, build y deploy.
- `node_modules` vive en un volumen nombrado; el código se monta con bind mount para hot-reload.
- Secretos solo por variables de entorno (`.env`, ignorado por git); se versiona `.env.example`.

### Tests E2E

- Playwright se ejecuta en el servicio `e2e` con la imagen oficial `mcr.microsoft.com/playwright`, que ya incluye los navegadores: **nada se instala en el host**.
- Los tests viven en `e2e/` y emulan un viewport móvil (Pixel 7), geolocalización, idioma y funcionamiento offline de la PWA.
- `scripts/test.sh` ejecuta lint, tests unitarios y build; `scripts/e2e.sh` ejecuta Playwright; `scripts/check.sh` ejecuta ambos.

### Servidor de pruebas manual

- `scripts/servidor.sh` construye la app y sirve el build de producción con la PWA real en el puerto **4173**, accesible desde el móvil mediante la IP de la red local.
- `scripts/servidor.sh --dev` arranca Vite con hot reload en el puerto **5173**.
- `scripts/servidor.sh --stop` detiene los contenedores.
- Limitación de plataforma: la API de geolocalización exige HTTPS o `localhost`. Al probar desde el móvil por HTTP, el GPS puede estar bloqueado; el flujo de calle debe probarse en `http://localhost:4173` (escritorio) o con un túnel HTTPS. La captura de foto con `<input capture>` no requiere HTTPS.

### Cloudflare Workers (Static Assets)

- Build de producción (`dist/`) generado dentro del contenedor.
- El despliegue es un **Worker con assets estáticos**, no un proyecto de Pages. `wrangler.jsonc` declara `assets.directory: "./dist"` y `not_found_handling: "single-page-application"`; no se usa `pages_build_output_dir`, así que `wrangler deploy` (y solo ese comando) es el correcto.
- Deploy manual desde el contenedor: `docker compose run --rm app npm run deploy`.
- El comando de deploy vive en el repositorio (`package.json`), no en la configuración del dashboard: no hay build ni deploy gestionados por Cloudflare desde Git, con lo que no puede desincronizarse.
- `public/_headers`: el service worker (`sw.js`) y los chunks de Workbox se sirven con `Cache-Control: no-cache`.
- El fallback SPA (`/* → /index.html`, 200) lo resuelve `not_found_handling: "single-page-application"`; no se versiona `_redirects`.

### Dependencias y auditoría

- `overrides` en `package.json` fija `minimatch@^11.0.4` y `glob@^14.0.3` para eliminar las alertas de DoS y prototype pollution de las cadenas de ESLint, TypeScript-ESLint y Workbox.
- Quedan 4 alertas `low` por `deepmerge` (transitiva de `workbox-build`, solo en tiempo de build) sin versión parcheada; se revisarán al actualizar `vite-plugin-pwa`/`workbox-build`.
- El runtime (`react`, `react-dom`, `i18next`, `react-i18next`) no tiene dependencias vulnerables.

## 7. Roadmap de ramas

| Rama | Alcance |
|---|---|
| `feat/setup-proyecto` | Vite + React 19 + TS, PWA, i18n base, Docker, estructura y pantalla inicial. |
| `feat/modelo-y-storage` | Tipos, servicio `localStorage`, servicio IndexedDB y hook de estado. |
| `feat/form-parking` | Formulario de parking y guardado con hora automática. |
| `feat/form-calle` | Formulario de calle, geolocalización, pago y enlace a Google Maps. |
| `feat/foto-coche` | Captura, preview, reemplazo y borrado de foto en IndexedDB. |
| `feat/vista-activo` | Vista del aparcamiento activo y acción "He recogido el coche". |
| `feat/estilos-mobile` | Pulido mobile-first, tema, accesibilidad y traducciones completas. |
| `feat/deploy-cloudflare` | `wrangler.jsonc`, `_headers`, verificación de PWA y despliegue en Workers. |

## 8. Definition of Done

Una funcionalidad solo se considera terminada —y su rama puede integrarse en `main`— cuando se cumple todo:

1. Implementada en su rama `feat/*` desde `main`, con commits `feat:`/`fix:` en español imperativo.
2. Cero dependencias, componentes o APIs deprecadas.
3. Todo ejecutado dentro de Docker; nada instalado en el host.
4. `npm run lint`, `npm run test`, `npm run test:e2e` y `npm run build` pasan dentro del contenedor sin errores ni warnings.
5. Todas las strings visibles traducidas en `es` y `ca`.
6. Verificada en viewport móvil y, cuando aplique, como PWA offline.
7. Datos solo en `localStorage`/`IndexedDB`; ninguna llamada de red con datos del usuario.
8. `specs.md` actualizado si la funcionalidad cambia algún requisito o flujo.
