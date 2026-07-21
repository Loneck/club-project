// Cloudflare Pages Function — POST /api/publish
//
// Publica el contenido del sitio (club.json) haciendo commit al repositorio vía la
// API de GitHub. El token de GitHub vive SOLO aquí (variable de entorno), nunca en el
// navegador. Requiere una sesión válida (cookie creada por /api/login).
//
// Variables de entorno (Settings → Variables and secrets del proyecto Pages):
//   ADMIN_PASSWORD  (secreto) contraseña del panel de administración
//   GITHUB_TOKEN    (secreto) PAT fine-grained, Contents: read/write, solo este repo
//   GITHUB_OWNER    usuario/organización dueño del repo
//   GITHUB_REPO     nombre del repo
//   GITHUB_BRANCH   rama (default: main)
//   FILE_PATH       ruta del archivo (default: public/data/club.json)

import { isAuthed } from './login.js'

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export async function onRequestPost(context) {
  const { request, env } = context
  try {
    // ——— Autenticación (sesión por cookie) ———
    if (!(await isAuthed(request, env))) {
      return json(401, { error: 'No autorizado. Inicia sesión.' })
    }

    // ——— Payload ———
    const body = await request.json().catch(() => null)
    const content = body && body.content
    if (typeof content !== 'string') return json(400, { error: 'Falta "content"' })
    try { JSON.parse(content) } catch (e) { return json(400, { error: 'El contenido no es JSON válido' }) }

    // ——— Config del repo ———
    const owner = env.GITHUB_OWNER
    const repo = env.GITHUB_REPO
    const branch = env.GITHUB_BRANCH || 'main'
    const path = env.FILE_PATH || 'public/data/club.json'
    if (!env.GITHUB_TOKEN || !owner || !repo) {
      return json(500, { error: 'Función no configurada (faltan GITHUB_TOKEN/OWNER/REPO)' })
    }

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const ghHeaders = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'club-project-publisher',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    // SHA actual (requerido para actualizar; ausente si el archivo no existe)
    let sha
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders })
    if (getRes.status === 200) {
      sha = (await getRes.json()).sha
    } else if (getRes.status !== 404) {
      return json(502, { error: `GitHub GET ${getRes.status}`, detail: await getRes.text() })
    }

    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: body.message || 'Actualiza contenido del sitio',
        content: toBase64Utf8(content),
        branch,
        ...(sha ? { sha } : {}),
      }),
    })
    if (!putRes.ok) {
      return json(502, { error: `GitHub PUT ${putRes.status}`, detail: await putRes.text() })
    }
    const data = await putRes.json()
    return json(200, { ok: true, commitUrl: data.commit && data.commit.html_url })
  } catch (e) {
    return json(500, { error: e.message || 'Error inesperado' })
  }
}
