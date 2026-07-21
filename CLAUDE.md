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
4. **Publicar** (`AdminLayout.vue`) → `publish.js` `publishToGit()` hace PUT a la Contents API →
   `store.markPublished()` limpia la copia de trabajo y reasigna `baseline`.
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

## Publicación (`src/services/publish.js`)

- Config en `localStorage` (`cdsp_publish_cfg_v1`): `{ owner, repo, branch, path, token }`.
- Usa GitHub Contents API: GET para obtener el `sha` actual, PUT para commitear (contenido en
  base64 UTF-8).
- El token (PAT) queda en el navegador del admin. Para multi-admin, migrar a función serverless.

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
