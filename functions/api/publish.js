// Cloudflare Pages Function — POST /api/publish
//
// Publica el contenido del sitio (club.json) haciendo commit al repositorio vía la
// API de GitHub. El token de GitHub vive SOLO aquí (variable de entorno), nunca en el
// navegador. Requiere una sesión válida (cookie creada por /api/login).
//
// GET  → devuelve el sha actual del archivo, para que el panel sepa sobre qué versión
//        está editando.
// POST → publica. Si el cuerpo trae "baseSha" y ese sha ya no es el del repo, significa
//        que otra sesión publicó después: responde 409 en vez de sobrescribir. El panel
//        pide confirmación explícita y reintenta con "force". Sin esta guarda, una copia
//        de trabajo vieja en localStorage puede pisar el contenido bueno del sitio.
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

// Config del repo a partir de las variables de entorno.
function repoConfig(env) {
  return {
    owner: env.GITHUB_OWNER,
    repo: env.GITHUB_REPO,
    branch: env.GITHUB_BRANCH || 'main',
    path: env.FILE_PATH || 'public/data/club.json',
  }
}

function githubHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'club-project-publisher',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

// sha del archivo en el repo. null si todavía no existe.
async function currentSha(env) {
  const { owner, repo, branch, path } = repoConfig(env)
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${encodeURIComponent(branch)}`
  const res = await fetch(url, { headers: githubHeaders(env) })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`GitHub GET ${res.status}: ${await res.text()}`)
  return (await res.json()).sha
}

// GET /api/publish → { sha } de la versión publicada actualmente.
export async function onRequestGet(context) {
  const { request, env } = context
  if (!(await isAuthed(request, env))) return json(401, { error: 'No autorizado. Inicia sesión.' })
  if (!env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
    return json(500, { error: 'Función no configurada (faltan GITHUB_TOKEN/OWNER/REPO)' })
  }
  try {
    return json(200, { sha: await currentSha(env) })
  } catch (e) {
    return json(502, { error: e.message })
  }
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
    const { owner, repo, branch, path } = repoConfig(env)
    if (!env.GITHUB_TOKEN || !owner || !repo) {
      return json(500, { error: 'Función no configurada (faltan GITHUB_TOKEN/OWNER/REPO)' })
    }

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`
    const ghHeaders = githubHeaders(env)

    // SHA actual (requerido para actualizar; null si el archivo no existe)
    let sha
    try {
      sha = await currentSha(env)
    } catch (e) {
      return json(502, { error: e.message })
    }

    // ——— Guarda contra sobrescritura ———
    // El panel manda el sha sobre el que se hicieron los cambios. Si ya no coincide,
    // otra sesión publicó en el intermedio y publicar borraría su trabajo.
    if (!body.force) {
      if (!body.baseSha) {
        return json(409, {
          code: 'UNKNOWN_BASE',
          error: 'No se puede verificar sobre qué versión se hicieron estos cambios.',
        })
      }
      if (body.baseSha !== sha) {
        return json(409, {
          code: 'STALE_BASE',
          error: 'El contenido del sitio cambió después de que cargaste esta copia.',
        })
      }
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
    return json(200, {
      ok: true,
      commitUrl: data.commit && data.commit.html_url,
      sha: data.content && data.content.sha,
    })
  } catch (e) {
    return json(500, { error: e.message || 'Error inesperado' })
  }
}
