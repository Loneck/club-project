<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navPages = [
  { key: 'home', label: 'Inicio', to: { name: 'home' } },
  { key: 'entrenamientos', label: 'Entrenamientos', to: { name: 'entrenamientos' } },
  { key: 'adulto', label: 'Adulto', to: { name: 'categoria', params: { cat: 'adulto' } } },
  { key: 'senior', label: 'Senior', to: { name: 'categoria', params: { cat: 'senior' } } },
  { key: 'femenino', label: 'Femenino', to: { name: 'categoria', params: { cat: 'femenino' } } },
  { key: 'campeonatos', label: 'Campeonatos', to: { name: 'campeonatos' } },
  { key: 'galeria', label: 'Galería', to: { name: 'galeria' } },
  { key: 'contacto', label: 'Contacto', to: { name: 'contacto' } },
]

const activeKey = computed(() => {
  if (route.name === 'categoria') return route.params.cat
  return route.name
})

const navBase =
  'font-family:var(--font-family);font-weight:600;font-size:14px;padding:8px 12px;border-radius:999px;border:0;cursor:pointer;white-space:nowrap;transition:color .12s,background .12s;'

function navStyle(key) {
  return navBase + (activeKey.value === key
    ? 'color:#fff;background:rgba(0,155,217,.22);'
    : 'color:rgba(255,255,255,.62);background:none;')
}
</script>

<template>
  <div style="display:flex;flex-direction:column;min-height:100vh;background:var(--bg-1);color:var(--fg-2)">
    <header style="position:sticky;top:0;z-index:50;background:#0E141B;border-bottom:1px solid rgba(255,255,255,.08)">
      <div style="max-width:1180px;margin:0 auto;padding:12px 24px;display:flex;align-items:center;gap:20px">
        <button
          @click="router.push({ name: 'home' })"
          style="display:flex;align-items:center;gap:11px;background:none;border:0;cursor:pointer;padding:0"
        >
          <img src="/assets/logo.png" alt="Club Project"
               style="width:42px;height:42px;object-fit:contain" />
          <span style="display:flex;flex-direction:column;line-height:1;text-align:left">
            <span style="font-family:var(--font-family);font-weight:700;font-size:15px;color:#fff;letter-spacing:.02em">PROJECT</span>
            <span style="font-family:var(--font-family);font-weight:600;font-size:10px;color:#7FD3F2;letter-spacing:.06em;text-transform:uppercase;margin-top:3px">Club Deportivo y Social</span>
          </span>
        </button>
        <nav class="cdsp-scroll cdsp-nav" style="margin-left:auto;display:flex;align-items:center;gap:2px">
          <button
            v-for="n in navPages"
            :key="n.key"
            :style="navStyle(n.key)"
            @click="router.push(n.to)"
          >{{ n.label }}</button>
          <button
            class="gv-btn gv-btn--pill gv-btn--primary"
            style="margin-left:10px;height:34px"
            @click="router.push({ name: 'contacto' })"
          >Únete</button>
        </nav>
      </div>
    </header>

    <main style="flex:1">
      <router-view />
    </main>

    <footer style="background:#0A0E13;color:rgba(255,255,255,.6);border-top:1px solid rgba(255,255,255,.08)">
      <div style="max-width:1180px;margin:0 auto;padding:32px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="/assets/logo.png" alt="Club Project" style="width:38px;height:38px;object-fit:contain" />
          <div>
            <div style="font-family:var(--font-family);font-weight:700;font-size:14px;color:#fff">Club Deportivo y Social Project</div>
            <div style="font-family:var(--font-family);font-size:12px;color:rgba(255,255,255,.5)">Básquetbol · Comunidad · Compromiso</div>
          </div>
        </div>
        <button
          @click="router.push({ name: 'admin-portada' })"
          style="display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.18);border-radius:999px;color:rgba(255,255,255,.75);font-family:var(--font-family);font-weight:600;font-size:13px;padding:8px 16px;cursor:pointer"
        ><i class="fa-solid fa-gear" style="font-size:12px"></i>Panel de administración</button>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.cdsp-nav { overflow-x: auto; }
@media (max-width: 720px) {
  .cdsp-nav { gap: 0; }
}
</style>
