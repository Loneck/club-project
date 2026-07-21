# Club Deportivo y Social Project — Sitio web

Sitio web del club de básquetbol **Project**: un **sitio estático** con un **dashboard de
administración** para gestionar el contenido, **sin base de datos**.

Todo el contenido vive en un único archivo JSON versionado en Git (`public/data/club.json`).
El dashboard edita ese contenido y, al **Publicar**, hace un commit del JSON al repositorio;
el redeploy automático del hosting regenera el sitio. Git es, en la práctica, la base de datos.

## Qué incluye

**Sitio público**
- Inicio: hero (3 estilos: dividido / centrado / con estadísticas), próximo partido (carrusel),
  campeonatos en juego, categorías, entrenamientos de la semana + mensualidad, CTA.
- Entrenamientos: fichas por categoría + vista semanal.
- Categoría (Adulto / Senior / Femenino): descripción + plantel.
- Campeonatos: tabla de posiciones (puntos = PG × 2) + partidos.
- Galería.
- Contacto: pasos para inscribirse, datos del club y formulario (abre el correo del club).

**Dashboard** (`/admin`)
- Portada: textos del hero, estilo del hero y mensualidad.
- Entrenamientos, Jugadores, Campeonatos (tabla + partidos), Galería — todos con alta/edición/baja.
- Botón **Publicar** que sube los cambios a Git.

## Stack

- **Vue 3 + Vite** (SPA con Vue Router).
- **Pinia** para el estado.
- **Design system propio** (sin Bootstrap/Tailwind): `src/styles/tokens.css` (variables) +
  `src/styles/platform.css` (clases `gv-*`). Íconos: Font Awesome (CDN). Tipografía: Nunito (local).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
npm run preview  # sirve dist/ localmente
```

- Sitio público: `/`
- Dashboard: `/admin`

## Modelo de datos (`public/data/club.json`)

```jsonc
{
  "settings": { "heroVariant": "split", "venue": "...", "contact": { "email", "instagram", "phone" } },
  "cover": { "badge", "title", "subtitle" },
  "membership": { "fee": 20000 },
  "trainings":   [{ "id", "category", "days", "time", "place", "coach" }],
  "players":     [{ "id", "name", "number", "position", "category" }],
  "championships":[{ "id", "name", "category", "status",
                     "standings": [{ "id", "team", "pj", "pg", "pp" }],
                     "results":   [{ "id", "date", "home", "away", "hs", "as", "status" }] }],
  "gallery":     [{ "id", "src", "caption" }]
}
```

`category` es uno de `adulto | senior | femenino`. Los puntos de la tabla se calculan
(no se guardan): `pts = pg * 2`.

### Cómo edita el dashboard

Mientras editas, los cambios se guardan en el navegador (`localStorage`) como copia de trabajo
y el topbar muestra "Cambios sin publicar". **Descartar** vuelve al último estado publicado;
**Publicar** hace el commit a Git.

## Publicación y despliegue (sin base de datos)

1. Sube este repo a GitHub.
2. Conéctalo a un hosting estático con redeploy automático: **Cloudflare Pages** o **Netlify**
   (recomendados; gratis). Configuración de build: `npm run build`, directorio de salida `dist`.
3. En el dashboard, primer **Publicar** → se pide la configuración una sola vez:
   - **owner**: tu usuario/organización de GitHub.
   - **repo**: nombre del repositorio.
   - **branch**: `main`.
   - **ruta**: `public/data/club.json`.
   - **token**: un GitHub *fine-grained PAT* con permiso *Contents: Read and write* sobre este repo.

   La config y el token se guardan **solo en el navegador del administrador** (`localStorage`).
   Al publicar, se hace commit del JSON y el hosting regenera el sitio en ~1 minuto.

Sin configurar el token, el botón **Descargar JSON** del modal permite bajar el `club.json`
y subirlo manualmente al repo.

> **Nota de seguridad:** guardar el PAT en el navegador es aceptable para un único administrador.
> Si más adelante varias personas administran, conviene reemplazar `src/services/publish.js`
> por una pequeña función serverless (Cloudflare/Netlify Functions) que guarde el token del
> lado del servidor y exponga un endpoint de publicación autenticado.

## Formulario de contacto

Al ser un sitio estático sin backend, el formulario arma un correo (`mailto:`) al club con los
datos ingresados. Para recibir las solicitudes en una bandeja/planilla se puede integrar un
servicio de formularios (p. ej. Formspree) sin cambiar el resto del sitio.

## Estructura

```
public/
  data/club.json        # contenido (fuente de verdad, versionado)
  assets/logo.jpg
  fonts/Nunito-*.ttf
src/
  styles/               # tokens.css + platform.css (design system)
  stores/club.js        # estado Pinia + CRUD + cálculo de tablas
  services/publish.js   # publicación a Git (GitHub Contents API) + descarga
  router/index.js
  components/            # EntityModal, Toast
  views/public/          # sitio público
  views/admin/           # dashboard
```
