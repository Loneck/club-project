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

Hosting: **Cloudflare Pages** (gratis). Build command `npm run build`, salida `dist`.
La carpeta `functions/` se despliega automáticamente como Cloudflare Pages Functions.

Al **Publicar**, el dashboard llama a `POST /api/publish` (la función serverless), que hace
commit de `public/data/club.json` con el token de GitHub y dispara el redeploy (~1 min).

### Seguridad del dashboard

En un sitio estático, esconder el `/admin` con una contraseña en JS **no es seguridad real**.
La protección real es doble:

1. **El token de GitHub nunca está en el navegador** — vive como secreto de servidor en la
   función `functions/api/publish.js` (variable `GITHUB_TOKEN`). Editar en `/admin` solo cambia
   una copia local; sin pasar por la función no se publica nada.
2. **Cloudflare Access** protege `/admin*` y `/api/*`: exige login por correo (OTP o Google)
   contra una lista de correos autorizados. La función además valida el JWT de Access.

### Setup en Cloudflare (una vez)

1. **GitHub**: crea el repo y súbelo. Genera un *fine-grained PAT* con **Contents: Read and write**
   restringido a este repo.
2. **Pages**: crea un proyecto conectado al repo. Build `npm run build`, salida `dist`.
3. **Variables de entorno del proyecto Pages** (Settings → Environment variables):
   - `GITHUB_TOKEN` (marcar como *Secret*), `GITHUB_OWNER`, `GITHUB_REPO`,
     `GITHUB_BRANCH` (`main`), `FILE_PATH` (`public/data/club.json`).
   - `ALLOWED_EMAILS` = correos autorizados separados por coma.
   - Tras crear la app de Access (paso 4): `CF_ACCESS_TEAM_DOMAIN` (ej `miclub.cloudflareaccess.com`)
     y `CF_ACCESS_AUD` (Application Audience tag) para validar el JWT.
4. **Cloudflare Access** (Zero Trust → Access → Applications): agrega una *Self-hosted app*
   cubriendo `tudominio.pages.dev/admin*` y `tudominio.pages.dev/api/*`, con una política
   *Allow* por *Emails* (los del club) y login por OTP/Google. Copia el **AUD** al env del paso 3.

El botón **Descargar JSON** (ícono ⬇ en el dashboard) baja un respaldo del contenido para
subirlo a mano al repo si hiciera falta.

> Para probar la función localmente: `npx wrangler pages dev -- npm run dev` (o `wrangler pages dev dist`).
> En `npm run dev` a secas, publicar avisa que solo funciona en el sitio desplegado.

### SEO / compartir

Tras el despliegue, reemplaza `https://TU-DOMINIO` por tu dominio real en `public/sitemap.xml`
y `public/robots.txt`, y pon la **URL absoluta** del logo en las etiquetas Open Graph
(`og:image`, `twitter:image`) e `og:url` de `index.html` — las previews de WhatsApp/redes
necesitan URLs absolutas para mostrar la imagen.

## Formulario de contacto

Al ser un sitio estático sin backend, el formulario arma un correo (`mailto:`) al club con los
datos ingresados. Para recibir las solicitudes en una bandeja/planilla se puede integrar un
servicio de formularios (p. ej. Formspree) sin cambiar el resto del sitio.

## Estructura

```
functions/
  api/publish.js        # Cloudflare Pages Function: commit a GitHub (token server-side) + Access JWT
public/
  data/club.json        # contenido (fuente de verdad, versionado)
  assets/logo.png
  fonts/Nunito-*.ttf
src/
  styles/               # tokens.css + platform.css (design system)
  stores/club.js        # estado Pinia + CRUD + cálculo de tablas
  services/publish.js   # cliente: llama a /api/publish, identidad Access, descarga respaldo
  router/index.js
  components/            # EntityModal, Toast
  views/public/          # sitio público
  views/admin/           # dashboard
```
