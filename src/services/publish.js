// Cliente de administración. Habla con las funciones serverless protegidas por sesión.
// La sesión es una cookie HttpOnly (creada por /api/login); el navegador la envía sola.
// El token de GitHub NO vive en el navegador.

async function readError(res) {
  try {
    const j = await res.clone().json()
    return j.error || j.detail || JSON.stringify(j)
  } catch (e) {
    try { return await res.text() } catch (_) { return '' }
  }
}

function ensureJson(res) {
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    throw new Error('Las funciones solo están disponibles en el sitio desplegado (no en desarrollo local).')
  }
}

// Inicia sesión con la contraseña del panel. Devuelve true si es correcta.
export async function login(password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ password }),
  })
  ensureJson(res)
  if (res.status === 401) return false
  if (!res.ok) throw new Error(`Error de login (${res.status}): ${await readError(res)}`)
  return true
}

// ¿La sesión actual es válida?
export async function checkSession() {
  try {
    const res = await fetch('/api/login', { credentials: 'same-origin', cache: 'no-store' })
    if (!(res.headers.get('content-type') || '').includes('application/json')) return false
    return res.ok
  } catch (e) {
    return false
  }
}

export async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' })
  } catch (e) { /* noop */ }
}

// Publica el JSON del sitio. Devuelve { ok, commitUrl }. Lanza si la sesión expiró (401).
export async function publish(jsonString, message) {
  let res
  try {
    res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ content: jsonString, message }),
    })
  } catch (e) {
    throw new Error('No se pudo contactar el servidor de publicación: ' + e.message)
  }
  ensureJson(res)
  if (res.status === 401) {
    const err = new Error('Tu sesión expiró. Inicia sesión de nuevo.')
    err.code = 'UNAUTHORIZED'
    throw err
  }
  if (!res.ok) throw new Error(`Error al publicar (${res.status}): ${await readError(res)}`)
  return res.json()
}

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
