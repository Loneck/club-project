// Cliente de publicación. Habla con la función serverless /api/publish
// (protegida por Cloudflare Access). El token de GitHub NO vive en el navegador.

async function readError(res) {
  try {
    const j = await res.clone().json()
    return j.error || j.detail || JSON.stringify(j)
  } catch (e) {
    try { return await res.text() } catch (_) { return '' }
  }
}

// Publica el JSON del sitio. Devuelve { ok, commitUrl, by }.
export async function publish(jsonString, message) {
  let res
  try {
    res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: jsonString, message }),
    })
  } catch (e) {
    throw new Error('No se pudo contactar el servidor de publicación: ' + e.message)
  }

  // En desarrollo local no existe la función: Vite responde el index.html (HTML, no JSON).
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error('La publicación solo funciona en el sitio desplegado (no en desarrollo local).')
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error((await readError(res)) || 'No autorizado. Inicia sesión para publicar.')
  }
  if (!res.ok) {
    throw new Error(`Error al publicar (${res.status}): ${await readError(res)}`)
  }
  return res.json()
}

// Identidad del usuario autenticado por Cloudflare Access (o null si no aplica).
export async function getIdentity() {
  try {
    const r = await fetch('/cdn-cgi/access/get-identity', { cache: 'no-store' })
    if (!r.ok) return null
    return await r.json()
  } catch (e) {
    return null
  }
}

export const LOGOUT_URL = '/cdn-cgi/access/logout'

// Fallback de emergencia: descargar el JSON para subirlo manualmente al repo.
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
