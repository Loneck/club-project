<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'

const route = useRoute()
const router = useRouter()
const store = useClubStore()

const mobileOpen = ref(false)

const navPages = computed(() => [
  { key: 'home', label: 'Inicio', to: { name: 'home' } },
  { key: 'entrenamientos', label: 'Entrenamientos', to: { name: 'entrenamientos' } },
  ...store.categoryList.map((c) => ({ key: c.key, label: c.short, to: { name: 'categoria', params: { cat: c.key } } })),
  { key: 'campeonatos', label: 'Campeonatos', to: { name: 'campeonatos' } },
  { key: 'galeria', label: 'Galería', to: { name: 'galeria' } },
  { key: 'contacto', label: 'Contacto', to: { name: 'contacto' } },
])

const activeKey = computed(() => {
  if (route.name === 'categoria') return route.params.cat
  return route.name
})

const navBase =
  'font-family:var(--font-family);font-weight:600;font-size:14px;padding:8px 12px;border-radius:999px;border:0;cursor:pointer;white-space:nowrap;transition:color .12s,background .12s;background:none;'

function navStyle(key) {
  return navBase + (activeKey.value === key
    ? 'color:#fff;background:rgba(0,155,217,.22);'
    : 'color:rgba(255,255,255,.62);')
}

function navTo(to) {
  router.push(to)
  mobileOpen.value = false
}

const igHandle = computed(() => store.contactInfo.instagram || '')
function igUrl(handle) {
  const s = String(handle || '').trim()
  if (!s) return '#'
  if (/^https?:\/\//i.test(s)) return s
  return 'https://instagram.com/' + s.replace(/^@/, '')
}
</script>

<template>
  <div style="display:flex;flex-direction:column;min-height:100vh;background:var(--bg-1);color:var(--fg-2)">
    <header style="position:sticky;top:0;z-index:50;background:#0E141B;border-bottom:1px solid rgba(255,255,255,.08)">
      <div style="max-width:1180px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:16px">
        <button
          @click="navTo({ name: 'home' })"
          style="display:flex;align-items:center;gap:11px;background:none;border:0;cursor:pointer;padding:0"
        >
          <img src="/assets/logo.png" alt="Club Project" style="width:42px;height:42px;object-fit:contain" />
          <span style="display:flex;flex-direction:column;line-height:1;text-align:left">
            <span style="font-family:var(--font-family);font-weight:700;font-size:15px;color:#fff;letter-spacing:.02em">PROJECT</span>
            <span style="font-family:var(--font-family);font-weight:600;font-size:10px;color:#7FD3F2;letter-spacing:.06em;text-transform:uppercase;margin-top:3px">Club Deportivo y Social</span>
          </span>
        </button>

        <!-- Nav desktop -->
        <nav class="desktop-nav" style="margin-left:auto;display:flex;align-items:center;gap:2px">
          <button v-for="n in navPages" :key="n.key" :style="navStyle(n.key)" @click="navTo(n.to)">{{ n.label }}</button>
          <button class="gv-btn gv-btn--pill gv-btn--primary" style="margin-left:10px;height:34px" @click="navTo({ name: 'contacto' })">Únete</button>
        </nav>

        <!-- Botón hamburguesa (móvil) -->
        <button
          class="nav-toggle"
          :aria-expanded="mobileOpen"
          aria-label="Abrir menú"
          @click="mobileOpen = !mobileOpen"
        >
          <i :class="mobileOpen ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'"></i>
        </button>
      </div>

      <!-- Menú móvil desplegable -->
      <transition name="cdsp-menu">
        <nav v-if="mobileOpen" class="mobile-menu">
          <button
            v-for="n in navPages"
            :key="n.key"
            class="mobile-menu__item"
            :class="{ 'is-active': activeKey === n.key }"
            @click="navTo(n.to)"
          >{{ n.label }}</button>
          <button class="gv-btn gv-btn--pill gv-btn--primary" style="height:40px;margin-top:8px" @click="navTo({ name: 'contacto' })">Únete</button>
        </nav>
      </transition>
    </header>

    <main style="flex:1">
      <router-view />
    </main>

    <footer style="background:#0A0E13;color:rgba(255,255,255,.6);border-top:1px solid rgba(255,255,255,.08)">
      <div style="max-width:1180px;margin:0 auto;padding:32px 20px;display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="/assets/logo.png" alt="Club Project" style="width:38px;height:38px;object-fit:contain" />
          <div>
            <div style="font-family:var(--font-family);font-weight:700;font-size:14px;color:#fff">Club Deportivo y Social Project</div>
            <div style="font-family:var(--font-family);font-size:12px;color:rgba(255,255,255,.5)">Básquetbol · Comunidad · Compromiso</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:14px">
          <a
            v-if="igHandle"
            :href="igUrl(igHandle)"
            target="_blank"
            rel="noopener"
            aria-label="Instagram del club"
            style="display:inline-flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,.18);color:rgba(255,255,255,.75);font-size:17px"
          ><i class="fa-brands fa-instagram"></i></a>
          <button
            @click="router.push({ name: 'admin-portada' })"
            style="display:inline-flex;align-items:center;gap:8px;background:none;border:1px solid rgba(255,255,255,.18);border-radius:999px;color:rgba(255,255,255,.75);font-family:var(--font-family);font-weight:600;font-size:13px;padding:8px 16px;cursor:pointer"
          ><i class="fa-solid fa-gear" style="font-size:12px"></i>Panel de administración</button>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.desktop-nav { overflow-x: auto; max-width: 100%; }
.desktop-nav::-webkit-scrollbar { height: 6px; }
.desktop-nav::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, .18); border-radius: 999px; }

.nav-toggle {
  display: none;
  margin-left: auto;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .16);
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  align-items: center;
  justify-content: center;
}
.nav-toggle:hover { background: rgba(255, 255, 255, .12); }

.mobile-menu {
  display: none;
  flex-direction: column;
  gap: 2px;
  padding: 8px 20px 16px;
  background: #0E141B;
  border-top: 1px solid rgba(255, 255, 255, .08);
}
.mobile-menu__item {
  text-align: left;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 15px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 0;
  background: none;
  color: rgba(255, 255, 255, .72);
  cursor: pointer;
}
.mobile-menu__item:hover { background: rgba(255, 255, 255, .06); color: #fff; }
.mobile-menu__item.is-active { background: rgba(0, 155, 217, .22); color: #fff; }

.cdsp-menu-enter-active, .cdsp-menu-leave-active { transition: opacity .18s ease; }
.cdsp-menu-enter-from, .cdsp-menu-leave-to { opacity: 0; }

@media (max-width: 860px) {
  .desktop-nav { display: none !important; }
  .nav-toggle { display: inline-flex; }
  .mobile-menu { display: flex; }
}
</style>
