// Cloudflare Pages Function — POST /api/upload
//
// Sube una imagen de galería haciendo commit del archivo a public/assets/gallery/ del repo.
// Requiere sesión válida (misma cookie que /api/publish). El navegador ya envía la imagen
// redimensionada y codificada en base64.
//
// Body JSON: { filename: string, contentBase64: string }  → devuelve { ok, path }

import { isAuthed } from './login.js'

function json(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function safeName(name) {
  const cleaned = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return cleaned.slice(-80) || 'img.jpg'
}

export async function onRequestPost(context) {
  const { request, env } = context
  try {
    if (!(await isAuthed(request, env))) {
      return json(401, { error: 'No autorizado. Inicia sesión.' })
    }

    const body = await request.json().catch(() => null)
    const filename = body && body.filename
    const contentBase64 = body && body.contentBase64
    if (!filename || typeof contentBase64 !== 'string' || !contentBase64) {
      return json(400, { error: 'Falta filename o contenido' })
    }

    const owner = env.GITHUB_OWNER
    const repo = env.GITHUB_REPO
    const branch = env.GITHUB_BRANCH || 'main'
    if (!env.GITHUB_TOKEN || !owner || !repo) {
      return json(500, { error: 'Función no configurada (faltan GITHUB_TOKEN/OWNER/REPO)' })
    }

    const name = safeName(filename)
    const repoPath = `public/assets/gallery/${name}`
    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}`
    const ghHeaders = {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'club-project-publisher',
      'X-GitHub-Api-Version': '2022-11-28',
    }

    let sha
    const getRes = await fetch(`${apiBase}?ref=${encodeURIComponent(branch)}`, { headers: ghHeaders })
    if (getRes.status === 200) sha = (await getRes.json()).sha
    else if (getRes.status !== 404) {
      return json(502, { error: `GitHub GET ${getRes.status}`, detail: await getRes.text() })
    }

    const putRes = await fetch(apiBase, {
      method: 'PUT',
      headers: { ...ghHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Sube imagen de galería ${name}`,
        content: contentBase64,
        branch,
        ...(sha ? { sha } : {}),
      }),
    })
    if (!putRes.ok) {
      return json(502, { error: `GitHub PUT ${putRes.status}`, detail: await putRes.text() })
    }
    return json(200, { ok: true, path: `/assets/gallery/${name}` })
  } catch (e) {
    return json(500, { error: e.message || 'Error inesperado' })
  }
}
