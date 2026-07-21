# CLAUDE.md — Club Project (sitio web)

Contexto técnico para agentes. Documentación funcional: @README.md

## Qué es

Sitio estático del club de básquetbol Project + dashboard de administración, **sin base de datos**.
El contenido vive en `public/data/club.json` (versionado). El dashboard edita ese JSON y al
publicar hace commit vía la API de GitHub; el hosting (Cloudflare Pages / Netlify) redeploya.

## Stack y arquitectura

- **Vue 3 + Vite**, SPA con **Vue Router** (`createWebHistory`).
- **Pinia** (`src/stores/club.js`) es la única fuente de estado en runtime.
- **Design system propio**, sin frameworks CSS. Tokens en `src/styles/tokens.css`
  (variables `--accent`, `--fg-*`, `--bg-*`, etc.), componentes en `src/styles/platform.css`
  (clases `gv-*`: `gv-btn`, `gv-table`, `gv-modal`, `gv-navitem`…). Íconos Font Awesome (CDN en
  `index.html`). Fuente Nunito servida desde `public/fonts/`.
- El diseño original salió de un handoff de Claude Design; el look debe mantenerse fiel.

## Flujo de datos

1. `store.load()` (en `App.vue onMounted`) hace `fetch` de `public/data/club.json` → `baseline`.
2. Si hay copia de trabajo en `localStorage` (`cdsp_working_v1`), esa es el `db` activo y se
   marca `dirty`.
3. Las mutaciones CRUD del store llaman `persist()` (guarda en localStorage + recalcula `dirty`).
4. **Publicar** (`AdminLayout.vue`) → `publish.js` `publish()` hace `POST /api/publish` (función
   serverless) → `store.markPublished()` limpia la copia de trabajo y reasigna `baseline`.
5. **Descartar** vuelve `db` a `baseline`.

`localStorage` es solo copia de trabajo del administrador; NO es el mecanismo de compartición.
El contenido público se comparte únicamente vía el `club.json` commiteado.

## Convenciones

- Categorías: `adulto | senior | femenino` (etiquetas y helpers en el store: `catLabel`,
  `catShort`, `catIcon`, `catDesc`).
- Tabla de posiciones: `pts = pg * 2`, orden por `pts`, luego `pg`, luego menor `pp`
  (`store.rankedStandings`).
- IDs generados con `uid(prefijo)`.
- El modal de formularios es genérico: `EntityModal.vue` guiado por un arreglo `fields`
  (`{ key, label, type: 'text'|'number'|'select', options?, placeholder? }`).

## Publicación y seguridad

Autenticación por **contraseña con sesión de cookie HttpOnly** (sin Cloudflare Access).

- **Cliente** (`src/services/publish.js`): `login(pw)` → `POST /api/login`; `checkSession()` →
  `GET /api/login`; `logout()` → `POST /api/logout`; `publish()` → `POST /api/publish` (la cookie
  viaja sola, `credentials:'same-origin'`). NO hay token ni contraseña persistida en el navegador.
  En dev local las funciones no existen (Vite devuelve HTML) → los helpers detectan content-type
  no-JSON y avisan; `AdminLayout` hace bypass de login en `import.meta.env.DEV`.
- **Gate del UI**: `AdminLayout.vue` llama `checkSession()` al montar; si no hay sesión renderiza
  `AdminLogin.vue` (pantalla de contraseña) en vez del panel. No hay guard de router.
- **Servidor** (`functions/api/`): `login.js` valida contra `ADMIN_PASSWORD` (compara hashes,
  timing-safe) y setea cookie `cdsp_auth` = SHA-256 derivado de la clave (HttpOnly, Secure,
  SameSite=Strict, 12h); exporta `isAuthed()`. `publish.js` importa `isAuthed`, y solo si hay
  sesión hace GET sha + PUT a la Contents API (base64 UTF-8) con `GITHUB_TOKEN`. `logout.js` borra
  la cookie. `upload.js` (POST, requiere sesión) commitea una imagen a `public/assets/gallery/` y
  devuelve su ruta; el cliente redimensiona la foto en el navegador (canvas, máx 1600px, JPEG)
  antes de enviarla (`uploadImage` en el servicio). Tras subir hay que **Publicar** para que la
  entrada de galería (club.json) se guarde.
- **Env vars** (Pages, Production): `ADMIN_PASSWORD` (secret), `GITHUB_TOKEN` (secret),
  `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`, `FILE_PATH`. Ver README.

## Comandos

```bash
npm run dev      # 5173
npm run build    # dist/
npm run preview
```

## Pendientes / ideas

- Subida de imágenes de galería a `public/assets/` (hoy se referencia por URL/ruta).
- Integrar servicio de formularios (Formspree) para el contacto.
- Opcional: función serverless para ocultar el PAT en publicación multi-usuario.
