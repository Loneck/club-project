// Cloudflare Pages Function — POST /api/publish
//
// Publica el contenido del sitio (club.json) haciendo commit al repositorio vía la
// API de GitHub. El token de GitHub vive SOLO aquí, como secreto del servidor
// (variable de entorno), nunca en el navegador.
//
// La ruta debe estar protegida por Cloudflare Access. Además, si se configuran
// CF_ACCESS_TEAM_DOMAIN + CF_ACCESS_AUD, se valida criptográficamente el JWT de
// Access (defensa en profundidad ante accesos directos a la URL de la función).
//
// Variables de entorno (Settings → Environment variables / Secrets del proyecto Pages):
//   GITHUB_TOKEN           (secreto) PAT fine-grained, Contents: read/write, solo este repo
//   GITHUB_OWNER           usuario/organización dueño del repo
//   GITHUB_REPO            nombre del repo
//   GITHUB_BRANCH          rama (default: main)
//   FILE_PATH              ruta del archivo (default: public/data/club.json)
//   CF_ACCESS_TEAM_DOMAIN  (opcional) ej: miclub.cloudflareaccess.com  → activa validación JWT
//   CF_ACCESS_AUD          (opcional) Application Audience (AUD) tag de la app de Access
//   ALLOWED_EMAILS         (opcional) lista separada por comas de correos autorizados

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

function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/')
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0
  s += '='.repeat(pad)
  const bin = atob(s)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

// Valida un JWT de Cloudflare Access (RS256) contra el JWKS del equipo.
async function verifyAccessJwt(token, teamDomain, aud) {
  const parts = token.split('.')
  if (parts.length !== 3) throw new Error('JWT malformado')
  const [h, p, sig] = parts
  const header = JSON.parse(new TextDecoder().decode(b64urlToBytes(h)))
  const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(p)))

  const certs = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`).then((r) => r.json())
  const jwk = (certs.keys || []).find((k) => k.kid === header.kid)
  if (!jwk) throw new Error('Clave (kid) de Access no encontrada')

  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  )
  const ok = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), new TextEncoder().encode(`${h}.${p}`)
  )
  if (!ok) throw new Error('Firma de Access inválida')
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token de Access expirado')
  if (aud) {
    const auds = Array.isArray(payload.aud) ? payload.aud : [payload.aud]
    if (!auds.includes(aud)) throw new Error('AUD de Access inválido')
  }
  return payload
}

export async function onRequestPost(context) {
  const { request, env } = context
  try {
    // ——— Autenticación (Cloudflare Access) ———
    const jwt = request.headers.get('Cf-Access-Jwt-Assertion')
    let email = request.headers.get('Cf-Access-Authenticated-User-Email') || ''

    if (env.CF_ACCESS_TEAM_DOMAIN && env.CF_ACCESS_AUD) {
      if (!jwt) return json(401, { error: 'No autenticado (sin token de Access)' })
      const payload = await verifyAccessJwt(jwt, env.CF_ACCESS_TEAM_DOMAIN, env.CF_ACCESS_AUD)
      email = payload.email || email
    } else if (!jwt) {
      // Sin validación estricta configurada, exigimos al menos que venga por Access.
      return json(401, { error: 'No autenticado' })
    }

    if (env.ALLOWED_EMAILS) {
      const allow = env.ALLOWED_EMAILS.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
      if (!allow.includes((email || '').toLowerCase())) {
        return json(403, { error: 'Correo no autorizado para publicar' })
      }
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
        message: (body.message || 'Actualiza contenido del sitio') + (email ? ` (por ${email})` : ''),
        content: toBase64Utf8(content),
        branch,
        ...(sha ? { sha } : {}),
      }),
    })
    if (!putRes.ok) {
      return json(502, { error: `GitHub PUT ${putRes.status}`, detail: await putRes.text() })
    }
    const data = await putRes.json()
    return json(200, { ok: true, commitUrl: data.commit && data.commit.html_url, by: email || null })
  } catch (e) {
    return json(500, { error: e.message || 'Error inesperado' })
  }
}
