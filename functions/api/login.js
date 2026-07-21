// Cloudflare Pages Function — /api/login
//   POST  { password }  → valida contra ADMIN_PASSWORD y crea sesión (cookie HttpOnly)
//   GET                 → indica si la sesión actual es válida
//
// La contraseña se compara del lado del servidor; el navegador nunca guarda la clave
// (la sesión es una cookie HttpOnly derivada de la clave, no legible por JavaScript).

const COOKIE = 'cdsp_auth'
const MAX_AGE = 60 * 60 * 12 // 12 horas

function json(status, obj, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...(extraHeaders || {}) },
  })
}

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function getCookie(request, name) {
  const raw = request.headers.get('Cookie') || ''
  const m = raw.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

// Token de sesión derivado de la clave (prueba de conocimiento, sin exponerla).
async function expectedToken(env) {
  return sha256hex('cdsp:' + env.ADMIN_PASSWORD)
}

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSWORD) return false
  const cookie = getCookie(request, COOKIE)
  if (!cookie) return false
  return timingSafeEqual(cookie, await expectedToken(env))
}

export async function onRequestPost(context) {
  const { request, env } = context
  if (!env.ADMIN_PASSWORD) return json(500, { error: 'Autenticación no configurada (falta ADMIN_PASSWORD)' })
  const body = await request.json().catch(() => null)
  const pw = body && body.password
  // Comparación por hash de igual longitud para no filtrar el largo de la clave.
  const okPw = typeof pw === 'string' && timingSafeEqual(await sha256hex(pw), await sha256hex(env.ADMIN_PASSWORD))
  if (!okPw) return json(401, { error: 'Contraseña incorrecta' })

  const token = await expectedToken(env)
  const cookie = `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${MAX_AGE}`
  return json(200, { ok: true }, { 'Set-Cookie': cookie })
}

export async function onRequestGet(context) {
  const { request, env } = context
  const ok = await isAuthed(request, env)
  return json(ok ? 200 : 401, { authenticated: ok })
}
