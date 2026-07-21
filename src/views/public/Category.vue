<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'

const props = defineProps({ key: { type: String, required: true } })
const store = useClubStore()
const router = useRouter()

const catKey = computed(() => (store.categories.includes(props.key) ? props.key : null))

const data = computed(() => {
  const k = catKey.value
  if (!k) return null
  const t = store.db.trainings.find((x) => x.category === k)
  const roster = store.db.players.filter((p) => p.category === k).slice().sort((a, b) => a.number - b.number)
  return {
    name: store.catLabel(k),
    icon: store.catIcon(k),
    desc: store.catDesc(k),
    days: t ? t.days : '—',
    time: t ? t.time : '—',
    coach: t ? (t.coach || '').split(' ')[0] : '—',
    count: roster.length,
    empty: roster.length === 0,
    roster,
  }
})
</script>

<template>
  <div v-if="data" class="cdsp-up">
    <section style="background:linear-gradient(180deg,#0E141B,#0A0E13);color:#fff">
      <div style="max-width:1180px;margin:0 auto;padding:44px 24px 40px">
        <button @click="router.push({ name: 'home' })" style="background:none;border:0;color:#7FD3F2;font-family:var(--font-family);font-weight:600;font-size:13px;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:6px"><i class="fa-solid fa-arrow-left-long" style="font-size:11px"></i>Inicio</button>
        <div style="display:flex;align-items:center;gap:8px;margin-top:16px"><i :class="data.icon" style="color:#7FD3F2;font-size:15px"></i><span style="font-family:var(--font-family);font-weight:600;font-size:12px;color:#7FD3F2;letter-spacing:.04em;text-transform:uppercase">Categoría</span></div>
        <h1 style="font-family:var(--font-family);font-weight:700;font-size:36px;letter-spacing:-.02em;margin:8px 0 0;color:#fff">{{ data.name }}</h1>
        <p style="font-family:var(--font-family);font-size:15px;line-height:1.6;color:rgba(255,255,255,.72);max-width:620px;margin:12px 0 0">{{ data.desc }}</p>
        <div style="display:flex;gap:22px;margin-top:24px;flex-wrap:wrap">
          <div><div style="font-family:var(--font-family);font-weight:700;font-size:24px;color:#fff">{{ data.count }}</div><div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:rgba(255,255,255,.55)">Jugadores</div></div>
          <div><div style="font-family:var(--font-family);font-weight:700;font-size:24px;color:#fff">{{ data.days }}</div><div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:rgba(255,255,255,.55)">{{ data.time }} hrs</div></div>
          <div><div style="font-family:var(--font-family);font-weight:700;font-size:24px;color:#fff">{{ data.coach }}</div><div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:rgba(255,255,255,.55)">Entrenador</div></div>
        </div>
      </div>
    </section>
    <section style="max-width:1180px;margin:0 auto;padding:40px 24px 72px">
      <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:16px">
        <h2 style="font-family:var(--font-family);font-weight:700;font-size:20px;color:var(--fg-1);margin:0">Plantel</h2>
        <span style="font-family:var(--font-family);font-weight:600;font-size:13px;color:var(--fg-3)">{{ data.count }} jugadores</span>
      </div>
      <div class="grid-4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
        <div v-for="p in data.roster" :key="p.id" style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:16px;text-align:center">
          <div style="width:56px;height:56px;margin:0 auto;border-radius:999px;background:#0E141B;color:#7FD3F2;display:flex;align-items:center;justify-content:center;font-family:var(--font-family);font-weight:700;font-size:18px">{{ p.number }}</div>
          <div style="font-family:var(--font-family);font-weight:700;font-size:15px;color:var(--fg-1);margin-top:12px">{{ p.name }}</div>
          <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);margin-top:3px">{{ p.position }}</div>
        </div>
      </div>
      <div v-if="data.empty" class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-top:8px"><div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>Aún no hay jugadores cargados en esta categoría.</div>
    </section>
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .grid-4 { grid-template-columns: repeat(2, 1fr) !important; } }
</style>
