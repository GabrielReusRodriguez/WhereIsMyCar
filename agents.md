# AGENTS.md — WhereIsMyCar

Instrucciones vinculantes para cualquier agente (humano o IA) que trabaje en este repositorio.

## Proyecto

Web app mobile-first para registrar dónde está aparcado el coche. Solo existe **un aparcamiento activo** a la vez. Al marcar que el coche ha sido recogido, el registro se elimina por completo: no hay historial.

## Stack

| Área | Tecnología |
|---|---|
| UI | React 19 + TypeScript (hooks y funciones, nunca class components) |
| Build | Vite |
| PWA | `vite-plugin-pwa` (service worker + manifest, offline) |
| Persistencia | `localStorage` para el registro + IndexedDB para la foto (Blob) |
| i18n | `react-i18next` con castellano (`es`) y catalán (`ca`) |
| Entorno | Docker (desarrollo, tests y build) |
| Despliegue | Cloudflare Workers (Static Assets) |

## Reglas no negociables

1. **Docker-only.** Nada se instala ni se ejecuta en el host. Todo comando de Node, npm, npx, tests, lint, build y deploy se ejecuta dentro del contenedor:
   ```bash
   docker compose run --rm app <comando>
   ```
   El único requisito del host es tener Docker y git.
2. **Sin APIs ni componentes deprecados.** Nada de APIs marcadas como deprecated en MDN, ni patrones obsoletos de React (class components, `componentWillMount`, etc.). Si una dependencia queda deprecada, se sustituye.
3. **Almacenamiento 100 % local.** Prohibido enviar datos del usuario (ubicación, fotos, direcciones) a cualquier servicio externo. Nada de backend ni nube. La única salida de red permitida es el enlace a Google Maps que abre el usuario bajo demanda.
4. **Un único aparcamiento.** El modelo no admite listas ni historial. Recoger el coche borra el registro y la foto.
5. **i18n obligatorio.** Ninguna string visible sin traducir. Toda clave nueva se añade a `es` y a `ca` en el mismo commit. El idioma se puede forzar con `?lang=es` o `?lang=ca` en la URL.
6. **Mobile-first.** El diseño se construye desde viewport móvil hacia arriba. Objetivos táctiles de al menos 44×44 px, `viewport` correcto, safe-areas y formularios usables con una mano.
7. **Conventional Commits en español**, imperativo y minúscula inicial: `feat:`, `fix:`, `docs:`, `refactor:`, etc. Máximo 72 caracteres en el asunto.
8. **Nunca commitear** `.env`, `dist/`, `node_modules/`, tokens ni secretos.
9. **La Definition of Done vive en `specs.md`** (sección "Definition of Done"). Es vinculante para cerrar cualquier rama.

## Estructura del repositorio

```
.
├── agents.md
├── specs.md
├── Dockerfile
├── docker-compose.yml
├── playwright.config.ts
├── e2e/                 # tests end-to-end con Playwright
├── scripts/             # atajos de test y verificación
├── public/              # assets estáticos e iconos PWA
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── i18n.ts
    ├── locales/         # es.json, ca.json
    └── ...
```

La estructura crecerá en ramas posteriores: `src/features/`, `src/storage/`, `src/types/`.

## Comandos de referencia

```bash
# Arrancar el entorno de desarrollo
docker compose up

# Instalar/actualizar dependencias
docker compose run --rm app npm install

# Lint, tests y build (obligatorio antes de cada commit)
docker compose run --rm app npm run lint
docker compose run --rm app npm run test
docker compose run --rm app npm run build

# Tests E2E con Playwright (imagen oficial con navegadores, nada en el host)
docker compose run --rm e2e

# Atajos equivalentes
./scripts/test.sh    # lint + tests unitarios + build
./scripts/e2e.sh     # tests E2E
./scripts/check.sh   # todo lo anterior

# Servidor de pruebas manual
./scripts/servidor.sh          # build de producción + PWA en :4173
./scripts/servidor.sh --dev    # desarrollo con hot reload en :5173
./scripts/servidor.sh --stop   # detener contenedores

# Deploy a Cloudflare Workers
docker compose run --rm app npm run deploy

# Comprobación del bundle sin publicar
docker compose run --rm app npm run deploy:dry-run
```

## Flujo de trabajo por funcionalidad

1. `git switch main && git pull --ff-only` (si hay remoto).
2. Implementar la funcionalidad completa (incluidas traducciones y estilos mobile-first).
3. Ejecutar lint, tests y build dentro de Docker.
4. Commit validado y merge a `main`.
5. Actualizar `specs.md` si la funcionalidad cambia algún requisito.
