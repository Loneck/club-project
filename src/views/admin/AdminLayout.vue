<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'
import { publish, getIdentity, downloadJson, LOGOUT_URL } from '@/services/publish'

const store = useClubStore()
const route = useRoute()
const router = useRouter()

const adminNav = [
  { name: 'admin-portada', label: 'Portada', icon: 'fa-solid fa-image' },
  { name: 'admin-entrenamientos', label: 'Entrenamientos', icon: 'fa-solid fa-calendar-days' },
  { name: 'admin-jugadores', label: 'Jugadores', icon: 'fa-solid fa-users' },
  { name: 'admin-campeonatos', label: 'Campeonatos', icon: 'fa-solid fa-trophy' },
  { name: 'admin-galeria', label: 'Galería', icon: 'fa-solid fa-images' },
]

const titles = {
  'admin-portada': 'Portada del sitio',
  'admin-entrenamientos': 'Entrenamientos',
  'admin-jugadores': 'Jugadores',
  'admin-campeonatos': 'Campeonatos',
  'admin-galeria': 'Galería',
}
const title = computed(() => titles[route.name] || 'Administración')

// ——— Identidad (Cloudflare Access) ———
const email = ref('')
const initials = computed(() => {
  const e = email.value
  if (!e) return 'AD'
  return e.slice(0, 2).toUpperCase()
})
onMounted(async () => {
  const id = await getIdentity()
  if (id && id.email) email.value = id.email
})

// ——— Publicación ———
const publishing = ref(false)

async function doPublish() {
  publishing.value = true
  try {
    const { commitUrl } = await publish(store.exportJson(), 'Actualiza contenido del sitio (dashboard)')
    store.markPublished()
    store.showToast('Publicado. El sitio se actualizará en ~1 min.')
    if (commitUrl) console.info('Commit:', commitUrl)
  } catch (e) {
    store.showToast(e.message)
  } finally {
    publishing.value = false
  }
}

function descargar() {
  downloadJson(store.exportJson(), 'club.json')
  store.showToast('JSON descargado.')
}
</script>

<template>
  <div class="gv-shell" style="min-height:100vh">
    <aside class="gv-sidebar">
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
          @click="router.push({ name: a.name })"
        ><i :class="a.icon"></i>{{ a.label }}</button>
      </nav>
      <div style="margin-top:auto;padding:8px;display:flex;flex-direction:column;gap:2px">
        <button class="gv-navitem" @click="router.push({ name: 'home' })"><i class="fa-solid fa-arrow-left"></i>Ver sitio público</button>
        <a v-if="email" class="gv-navitem" :href="LOGOUT_URL"><i class="fa-solid fa-right-from-bracket"></i>Cerrar sesión</a>
      </div>
    </aside>

    <main class="gv-main">
      <div class="gv-topbar">
        <h1 class="gv-topbar__title">{{ title }}</h1>
        <div class="gv-topbar__actions">
          <span v-if="store.dirty" style="font-family:var(--font-family);font-size:12px;font-weight:600;color:var(--color-highlight-main);display:inline-flex;align-items:center;gap:6px">
            <i class="fa-solid fa-circle" style="font-size:8px"></i>Cambios sin publicar
          </span>
          <button class="gv-btn gv-btn--pill gv-btn--tertiary" @click="descargar" style="height:34px" title="Descargar respaldo del contenido">
            <i class="fa-solid fa-download" style="font-size:12px"></i>
          </button>
          <button
            class="gv-btn gv-btn--pill gv-btn--secondary"
            :disabled="!store.dirty"
            @click="store.discardChanges()"
            style="height:34px"
          >Descartar</button>
          <button
            class="gv-btn gv-btn--pill gv-btn--primary"
            :disabled="publishing || !store.dirty"
            @click="doPublish"
            style="height:34px"
          >
            <i class="fa-solid" :class="publishing ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'" style="margin-right:6px;font-size:12px"></i>
            {{ publishing ? 'Publicando…' : 'Publicar' }}
          </button>
          <div class="gv-avatar" :title="email || 'Administrador'">{{ initials }}</div>
        </div>
      </div>

      <div class="gv-page cdsp-scroll" style="overflow:auto">
        <router-view />
      </div>
    </main>
  </div>
</template>
