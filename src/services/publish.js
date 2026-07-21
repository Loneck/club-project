// Publicación del contenido (club.json) a un repositorio Git vía la API de GitHub.
//
// Modelo "JSON en Git": el dashboard hace commit del archivo public/data/club.json.
// Un redeploy automático (Cloudflare Pages / Netlify / GitHub Pages) regenera el sitio.
//
// La config (repo + token) se guarda en localStorage del navegador del administrador.
// Para un club con un único admin es suficiente; si más adelante quieres ocultar el
// token, se reemplaza este servicio por una función serverless (ver README).

const CONFIG_KEY = 'cdsp_publish_cfg_v1'

export function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* noop */ }
  return { owner: '', repo: '', branch: 'main', path: 'public/data/club.json', token: '' }
}

export function saveConfig(cfg) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

export function isConfigured() {
  const c = getConfig()
  return !!(c.owner && c.repo && c.token && c.path)
}

// Codifica un string UTF-8 a base64 (requerido por la API de GitHub).
function toBase64Utf8(str) {
  const bytes = new TextEncoder().encode(str)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

async function ghFetch(cfg, extraPath, options = {}) {
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}${extraPath || ''}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.headers || {}),
    },
  })
  return res
}

// Devuelve el SHA actual del archivo (necesario para actualizar), o null si no existe.
async function getCurrentSha(cfg) {
  const res = await ghFetch(cfg, `?ref=${encodeURIComponent(cfg.branch)}`)
  if (res.status === 404) return null
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`No se pudo leer el archivo actual (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.sha
}

// Publica el contenido JSON. Devuelve { commitUrl }.
export async function publishToGit(jsonString, message) {
  const cfg = getConfig()
  if (!isConfigured()) throw new Error('Publicación no configurada')

  const sha = await getCurrentSha(cfg)
  const res = await ghFetch(cfg, '', {
    method: 'PUT',
    body: JSON.stringify({
      message: message || 'Actualiza contenido del sitio',
      content: toBase64Utf8(jsonString),
      branch: cfg.branch,
      ...(sha ? { sha } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Error al publicar (${res.status}): ${body}`)
  }
  const data = await res.json()
  return { commitUrl: data.commit && data.commit.html_url }
}

// Fallback sin configuración: descarga el JSON para subirlo manualmente al repo.
export function downloadJson(jsonString, filename = 'club.json') {
  const blob = new Blob([jsonString], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
