// Cloudflare Pages Function — POST /api/logout → borra la cookie de sesión.
export async function onRequestPost() {
  const cookie = 'cdsp_auth=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0'
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  })
}
