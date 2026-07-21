<script setup>
import { computed } from 'vue'
import { useClubStore } from '@/stores/club'

const store = useClubStore()

const trainingsView = computed(() =>
  store.db.trainings.map((t) => ({ ...t, catName: store.catLabel(t.category), coachFirst: (t.coach || '').split(' ')[0] }))
)

const dayMap = { Lunes: 0, Martes: 1, Miércoles: 2, Jueves: 3, Viernes: 4, Sábado: 5, Domingo: 6 }
const weekDays = computed(() => {
  const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((label) => ({ label, sessions: [] }))
  store.db.trainings.forEach((t) => {
    const parts = (t.days || '').split(/ y |,/).map((x) => x.trim())
    parts.forEach((p) => {
      const idx = dayMap[p]
      if (idx != null) days[idx].sessions.push({ cat: store.catShort(t.category), time: t.time })
    })
  })
  return days
})
</script>

<template>
  <div class="cdsp-up" style="max-width:1180px;margin:0 auto;padding:44px 24px 72px">
    <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Planificación</div>
    <h1 style="font-family:var(--font-family);font-weight:700;font-size:32px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 6px">Entrenamientos</h1>
    <p style="font-family:var(--font-family);font-size:15px;color:var(--fg-2);max-width:620px">Todos los entrenamientos se realizan en {{ store.venue }}. Trae ropa deportiva, agua y muchas ganas. Llega 10 minutos antes para el calentamiento.</p>

    <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px">
      <div v-for="t in trainingsView" :key="t.id" style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;overflow:hidden">
        <div style="padding:16px;border-bottom:1px solid var(--stroke-1);display:flex;align-items:center;justify-content:space-between">
          <span style="font-family:var(--font-family);font-weight:700;font-size:16px;color:var(--fg-1)">{{ t.catName }}</span>
          <span class="gv-badge" style="border-color:var(--accent);color:var(--accent)">{{ t.time }}</span>
        </div>
        <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:10px"><i class="fa-solid fa-calendar-day" style="width:18px;color:var(--accent)"></i><span style="font-family:var(--font-family);font-size:14px;color:var(--fg-2)">{{ t.days }}</span></div>
          <div style="display:flex;align-items:center;gap:10px"><i class="fa-solid fa-clock" style="width:18px;color:var(--accent)"></i><span style="font-family:var(--font-family);font-size:14px;color:var(--fg-2)">{{ t.time }} hrs</span></div>
          <div style="display:flex;align-items:center;gap:10px"><i class="fa-solid fa-location-dot" style="width:18px;color:var(--accent)"></i><span style="font-family:var(--font-family);font-size:14px;color:var(--fg-2)">{{ t.place }}</span></div>
          <div style="display:flex;align-items:center;gap:10px"><i class="fa-solid fa-user" style="width:18px;color:var(--accent)"></i><span style="font-family:var(--font-family);font-size:14px;color:var(--fg-2)">Entrenador: {{ t.coach }}</span></div>
        </div>
      </div>
    </div>

    <h2 style="font-family:var(--font-family);font-weight:700;font-size:18px;color:var(--fg-1);margin:40px 0 14px">Vista semanal</h2>
    <div style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;overflow:auto">
      <div style="min-width:640px">
        <div style="display:grid;grid-template-columns:repeat(7,1fr);background:var(--bg-3)">
          <div v-for="d in weekDays" :key="d.label" style="padding:10px 8px;text-align:center;font-family:var(--font-family);font-weight:600;font-size:13px;color:var(--fg-2);border-right:1px solid var(--stroke-1)">{{ d.label }}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(7,1fr);min-height:120px">
          <div v-for="d in weekDays" :key="d.label" style="padding:10px 8px;border-right:1px solid var(--stroke-1);display:flex;flex-direction:column;gap:6px">
            <div v-for="(ss, i) in d.sessions" :key="i" style="background:var(--accent-subtle);border-left:3px solid var(--accent);border-radius:4px;padding:8px">
              <div style="font-family:var(--font-family);font-weight:700;font-size:12px;color:var(--fg-1)">{{ ss.cat }}</div>
              <div style="font-family:var(--font-family);font-weight:600;font-size:11px;color:var(--accent);margin-top:2px">{{ ss.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .grid-3 { grid-template-columns: 1fr !important; } }
</style>
