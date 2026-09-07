<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'
import { publish, checkSession, logout, downloadJson, getPublishedSha } from '@/services/publish'
import AdminLogin from '@/views/admin/AdminLogin.vue'

const store = useClubStore()
const route = useRoute()
const router = useRouter()

const adminNav = [
  { name: 'admin-portada', label: 'Portada', icon: 'fa-solid fa-image' },
  { name: 'admin-categorias', label: 'Categorías', icon: 'fa-solid fa-layer-group' },
  { name: 'admin-entrenamientos', label: 'Entrenamientos', icon: 'fa-solid fa-calendar-days' },
  { name: 'admin-jugadores', label: 'Jugadores', icon: 'fa-solid fa-users' },
  { name: 'admin-campeonatos', label: 'Campeonatos', icon: 'fa-solid fa-trophy' },
  { name: 'admin-galeria', label: 'Galería', icon: 'fa-solid fa-images' },
  { name: 'admin-contacto', label: 'Contacto', icon: 'fa-solid fa-address-card' },
]

const titles = {
  'admin-portada': 'Portada del sitio',
  'admin-categorias': 'Categorías',
  'admin-entrenamientos': 'Entrenamientos',
  'admin-jugadores': 'Jugadores',
  'admin-campeonatos': 'Campeonatos',
  'admin-galeria': 'Galería',
  'admin-contacto': 'Contacto',
}
const title = computed(() => titles[route.name] || 'Administración')

// ——— Sesión ———
const authed = ref(false)
const checking = ref(true)
onMounted(async () => {
  if (import.meta.env.DEV) {
    authed.value = true // en desarrollo local no hay función de sesión
  } else {
    authed.value = await checkSession()
    if (authed.value) store.setBaselineSha(await getPublishedSha())
  }
  checking.value = false
})
async function onLogin() {
  authed.value = true
  store.setBaselineSha(await getPublishedSha())
}
async function doLogout() {
  await logout()
  authed.value = false
}

// ——— Sidebar móvil ———
const sidebarOpen = ref(false)
function navGo(name) {
  router.push({ name })
  sidebarOpen.value = false
}

// ——— Publicación ———
const publishing = ref(false)

// El servidor rechaza la publicación si el sitio cambió desde que se cargó esta copia de
// trabajo (o si la copia es anterior a esta protección). Ahí se pide confirmación
// explícita antes de sobrescribir, porque publicar borraría lo que otro publicó.
const OVERWRITE_WARNINGS = {
  STALE_BASE: `El contenido del sitio cambió después de que abriste esta copia: otra persona publicó en el intermedio.

Si publicas ahora, tus cambios REEMPLAZAN los de esa persona.

Aceptar = publicar igual.
Cancelar = no publicar (revisa el sitio y usa Descartar si tu copia está vieja).`,

  UNKNOWN_BASE: `No se puede saber sobre qué versión se hicieron estos cambios: la copia de trabajo quedó guardada antes de esta protección.

Si publicas ahora, el contenido del sitio se REEMPLAZA por el de esta copia.

Aceptar = publicar igual.
Cancelar = no publicar (revisa el sitio y usa Descartar si tu copia está vieja).`,
}

async function doPublish(force = false) {
  publishing.value = true
  try {
    const { commitUrl, sha } = await publish(
      store.exportJson(),
      'Actualiza contenido del sitio (dashboard)',
      { baseSha: store.workingBaseSha, force }
    )
    store.markPublished(sha)
    store.showToast('Publicado. El sitio se actualizará en ~1 min.')
    if (commitUrl) console.info('Commit:', commitUrl)
  } catch (e) {
    if (e.code === 'UNAUTHORIZED') {
      authed.value = false
      store.showToast(e.message)
    } else if (OVERWRITE_WARNINGS[e.code]) {
      publishing.value = false
      if (window.confirm(OVERWRITE_WARNINGS[e.code])) return doPublish(true)
      store.showToast('Publicación cancelada.')
    } else {
      store.showToast(e.message)
    }
  } finally {
    publishing.value = false
  }
}
function descargar() {
  downloadJson(store.exportJson(), 'club.json')
  store.showToast('JSON descargado.')
}

// Avisar si se intenta cerrar/recargar con cambios sin publicar.
function beforeUnload(e) {
  if (store.dirty) {
    e.preventDefault()
    e.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<template>
  <div v-if="checking" style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg-1)">
    <i class="fa-solid fa-spinner fa-spin" style="font-size:24px;color:var(--accent)"></i>
  </div>

  <AdminLogin v-else-if="!authed" @success="onLogin" />

  <div v-else class="gv-shell" style="min-height:100vh">
    <div v-if="sidebarOpen" class="admin-overlay" @click="sidebarOpen = false"></div>

    <aside class="gv-sidebar" :class="{ 'is-open': sidebarOpen }">
      <div class="gv-sidebar__logo" style="background:#0E141B;display:flex;align-items:center;gap:10px">
        <img src="/assets/logo.png" alt="Club Project" style="width:36px;height:36px;object-fit:contain" />
        <div>
          <div style="font-family:var(--font-family);font-weight:700;font-size:13px;color:#fff">PROJECT</div>
          <div style="font-family:var(--font-family);font-weight:600;font-size:10px;color:#7FD3F2">Administración</div>
        </div>
      </div>
      <nav class="gv-sidebar__nav">
        <button
          v-for="a in adminNav"
          :key="a.name"
          class="gv-navitem"
          :class="{ 'is-active': route.name === a.name }"
          @click="navGo(a.name)"
        ><i :class="a.icon"></i>{{ a.label }}</button>
      </nav>
      <div style="margin-top:auto;padding:8px;display:flex;flex-direction:column;gap:2px">
        <button class="gv-navitem" @click="navGo('home')"><i class="fa-solid fa-arrow-left"></i>Ver sitio público</button>
        <button class="gv-navitem" @click="doLogout"><i class="fa-solid fa-right-from-bracket"></i>Cerrar sesión</button>
      </div>
    </aside>

    <main class="gv-main">
      <div class="gv-topbar">
        <button class="admin-hamburger" aria-label="Abrir menú" @click="sidebarOpen = true"><i class="fa-solid fa-bars"></i></button>
        <h1 class="gv-topbar__title">{{ title }}</h1>
        <div class="gv-topbar__actions">
          <span v-if="store.dirty" class="dirty-badge" style="font-family:var(--font-family);font-size:12px;font-weight:600;color:var(--color-highlight-main);display:inline-flex;align-items:center;gap:6px">
            <i class="fa-solid fa-circle" style="font-size:8px"></i><span class="dirty-text">Cambios sin publicar</span>
          </span>
          <button class="gv-btn gv-btn--pill gv-btn--tertiary" @click="descargar" style="height:34px" title="Descargar respaldo del contenido">
            <i class="fa-solid fa-download" style="font-size:12px"></i>
          </button>
          <button class="gv-btn gv-btn--pill gv-btn--secondary" :disabled="!store.dirty" @click="store.discardChanges()" style="height:34px">Descartar</button>
          <button class="gv-btn gv-btn--pill gv-btn--primary" :disabled="publishing || !store.dirty" @click="doPublish" style="height:34px">
            <i class="fa-solid" :class="publishing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'" style="margin-right:6px;font-size:12px"></i>
            {{ publishing ? 'Publicando…' : 'Publicar' }}
          </button>
          <div class="gv-avatar" title="Administrador">AD</div>
        </div>
      </div>

      <div class="gv-page cdsp-scroll" style="overflow:auto">
        <div v-if="store.isWorkingStale" class="stale-banner">
          <i class="fa-solid fa-triangle-exclamation"></i>
          <div>
            <strong>Tus cambios sin publicar son más antiguos que el sitio.</strong>
            Alguien publicó después de que abriste esta copia. Si publicas, reemplazas su trabajo.
            Revisa el sitio y usa <strong>Descartar</strong> si esta copia ya no sirve.
          </div>
        </div>
        <router-view />
      </div>
    </main>
  </div>
</template>

<style scoped>
.stale-banner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
  padding: 12px 14px;
  border: 1px solid var(--warning, #e0a800);
  border-radius: 6px;
  background: #fff8e6;
  font-family: var(--font-family);
  font-size: 13px;
  color: var(--fg-1);
  line-height: 1.5;
}
.stale-banner i { color: var(--warning, #e0a800); margin-top: 2px; }

.admin-hamburger {
  display: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--stroke-1);
  background: #fff;
  color: var(--fg-2);
  font-size: 16px;
  cursor: pointer;
  margin-right: 4px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
}
.gv-topbar__title { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.admin-overlay { display: none; }

@media (max-width: 860px) {
  .gv-shell { grid-template-columns: 1fr; }
  .gv-sidebar {
    position: fixed; top: 0; bottom: 0; left: 0; width: 240px; z-index: 120;
    transform: translateX(-100%); transition: transform .22s ease;
  }
  .gv-sidebar.is-open { transform: translateX(0); box-shadow: 0 0 48px rgba(0, 0, 0, .35); }
  .admin-overlay { display: block; position: fixed; inset: 0; background: rgba(0, 0, 0, .38); z-index: 110; }
  .admin-hamburger { display: inline-flex; }
  .gv-topbar { padding: 10px 14px; gap: 8px; }
  .gv-topbar__actions { gap: 8px; }
  .dirty-text { display: none; }
  .gv-page { padding: 16px; }
}
</style>
