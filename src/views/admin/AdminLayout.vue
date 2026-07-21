<script setup>
import { ref, reactive, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'
import { getConfig, saveConfig, isConfigured, publishToGit, downloadJson } from '@/services/publish'

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

// ——— Publicación ———
const publishing = ref(false)
const showConfig = ref(false)
const cfg = reactive(getConfig())

async function doPublish() {
  if (!isConfigured()) {
    showConfig.value = true
    return
  }
  publishing.value = true
  try {
    const { commitUrl } = await publishToGit(store.exportJson(), 'Actualiza contenido del sitio (dashboard)')
    store.markPublished()
    store.showToast('Publicado. El sitio se actualizará en ~1 min.')
    if (commitUrl) console.info('Commit:', commitUrl)
  } catch (e) {
    store.showToast('Error al publicar: ' + e.message)
  } finally {
    publishing.value = false
  }
}

async function saveConfigAndPublish() {
  saveConfig({ ...cfg })
  showConfig.value = false
  await doPublish()
}

function downloadFallback() {
  downloadJson(store.exportJson(), 'club.json')
  store.showToast('Descargado. Súbelo a public/data/ en tu repo.')
}
</script>

<template>
  <div class="gv-shell" style="min-height:100vh">
    <aside class="gv-sidebar">
      <div class="gv-sidebar__logo" style="background:#0E141B;display:flex;align-items:center;gap:10px">
        <img src="/assets/logo.jpg" alt="Club Project" style="width:34px;height:34px;border-radius:999px;object-fit:cover" />
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
      <div style="margin-top:auto;padding:8px">
        <button class="gv-navitem" @click="router.push({ name: 'home' })"><i class="fa-solid fa-arrow-left"></i>Ver sitio público</button>
      </div>
    </aside>

    <main class="gv-main">
      <div class="gv-topbar">
        <h1 class="gv-topbar__title">{{ title }}</h1>
        <div class="gv-topbar__actions">
          <span v-if="store.dirty" style="font-family:var(--font-family);font-size:12px;font-weight:600;color:var(--color-highlight-main);display:inline-flex;align-items:center;gap:6px">
            <i class="fa-solid fa-circle" style="font-size:8px"></i>Cambios sin publicar
          </span>
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
          <div class="gv-avatar">AD</div>
        </div>
      </div>

      <div class="gv-page cdsp-scroll" style="overflow:auto">
        <router-view />
      </div>
    </main>

    <!-- Modal de configuración de publicación -->
    <div v-if="showConfig" class="gv-modal-overlay" @click="showConfig = false">
      <div class="gv-modal" style="width:520px" @click.stop>
        <div class="gv-modal__header">
          <div class="gv-modal__title">Configurar publicación</div>
          <div class="gv-modal__close" @click="showConfig = false"><i class="fa-solid fa-xmark"></i></div>
        </div>
        <div class="gv-modal__body">
          <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface)">
            <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
            Los cambios se guardan como un commit en tu repositorio Git. Necesitas un token de acceso con permiso de escritura al repo. Se guarda solo en este navegador.
          </div>
          <div class="gv-field"><label class="gv-label">Usuario / organización (owner)</label><input class="gv-input" v-model="cfg.owner" placeholder="ej: leonel" /></div>
          <div class="gv-field"><label class="gv-label">Repositorio</label><input class="gv-input" v-model="cfg.repo" placeholder="ej: club-project" /></div>
          <div class="gv-field"><label class="gv-label">Rama</label><input class="gv-input" v-model="cfg.branch" placeholder="main" /></div>
          <div class="gv-field"><label class="gv-label">Ruta del archivo</label><input class="gv-input" v-model="cfg.path" placeholder="public/data/club.json" /></div>
          <div class="gv-field"><label class="gv-label">Token de acceso (GitHub PAT)</label><input class="gv-input" type="password" v-model="cfg.token" placeholder="github_pat_..." /></div>
        </div>
        <div class="gv-modal__footer" style="justify-content:space-between">
          <button class="gv-btn gv-btn--pill gv-btn--tertiary" @click="downloadFallback">Descargar JSON</button>
          <div style="display:flex;gap:10px">
            <button class="gv-btn gv-btn--pill gv-btn--tertiary" @click="showConfig = false">Cancelar</button>
            <button class="gv-btn gv-btn--pill gv-btn--primary" @click="saveConfigAndPublish">Guardar y publicar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
