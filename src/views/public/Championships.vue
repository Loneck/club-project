<script setup>
import { computed } from 'vue'
import { useClubStore } from '@/stores/club'

const store = useClubStore()

const champsView = computed(() =>
  store.db.championships.map((ch) => {
    const ranked = store.rankedStandings(ch)
    const rows = ranked.map((r) => ({
      rank: r.rank, team: r.team, pj: r.pj, pg: r.pg, pp: r.pp, pts: r.pts,
      rankColor: r.rank <= 3 ? 'var(--accent)' : 'var(--fg-3)',
      weight: r.team === 'Club Project' ? '700' : '600',
      rowBg: r.team === 'Club Project' ? 'var(--accent-subtle)' : '#fff',
    }))
    const results = ch.results.map((g) => ({
      date: store.formatDate(g.date), home: g.home, away: g.away,
      scoreLabel: g.status === 'finalizado' ? `${g.hs} – ${g.as}` : 'Programado',
      scoreColor: g.status === 'finalizado' ? 'var(--fg-1)' : 'var(--fg-3)',
    }))
    return { id: ch.id, name: ch.name, catLabel: store.catLabel(ch.category), statusLabel: ch.status, finished: ch.status !== 'En curso', rows, results, hasResults: ch.results.length > 0 }
  })
)
</script>

<template>
  <div class="cdsp-up" style="max-width:1180px;margin:0 auto;padding:44px 24px 72px">
    <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Competencias</div>
    <h1 style="font-family:var(--font-family);font-weight:700;font-size:32px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 6px">Campeonatos</h1>
    <p style="font-family:var(--font-family);font-size:15px;color:var(--fg-2);max-width:620px">Sigue la participación de nuestros equipos y las tablas de posiciones actualizadas.</p>

    <div style="display:flex;flex-direction:column;gap:28px;margin-top:28px">
      <div v-for="ch in champsView" :key="ch.id" style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;overflow:hidden">
        <div style="padding:16px 18px;border-bottom:1px solid var(--stroke-1);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:38px;height:38px;border-radius:6px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-trophy" style="color:var(--accent)"></i></div>
            <div>
              <div style="font-family:var(--font-family);font-weight:700;font-size:17px;color:var(--fg-1)">{{ ch.name }}</div>
              <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3);margin-top:2px">{{ ch.catLabel }}</div>
            </div>
          </div>
          <span class="gv-badge" :style="ch.finished ? 'border-color:var(--stroke-1);color:var(--fg-3)' : 'border-color:var(--accent);color:var(--accent)'">{{ ch.statusLabel }}</span>
        </div>
        <div style="padding:16px 18px 18px">
          <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Tabla de posiciones</div>
          <div style="border:1px solid var(--stroke-1);border-radius:6px;overflow:auto">
            <div style="min-width:520px">
              <div style="display:grid;grid-template-columns:40px 1fr 48px 48px 48px 56px;background:var(--bg-3);height:36px;align-items:center">
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2)">#</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2)">Equipo</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2);text-align:center">PJ</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2);text-align:center">PG</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2);text-align:center">PP</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-2);text-align:center">Pts</div>
              </div>
              <div v-for="r in ch.rows" :key="r.rank" style="display:grid;grid-template-columns:40px 1fr 48px 48px 48px 56px;height:44px;align-items:center;border-top:1px solid var(--stroke-1)" :style="{ background: r.rowBg }">
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:700;font-size:13px" :style="{ color: r.rankColor }">{{ r.rank }}</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-size:14px;color:var(--fg-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" :style="{ fontWeight: r.weight }">{{ r.team }}</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-size:13px;color:var(--fg-2);text-align:center">{{ r.pj }}</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-size:13px;color:var(--fg-2);text-align:center">{{ r.pg }}</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-size:13px;color:var(--fg-2);text-align:center">{{ r.pp }}</div>
                <div style="padding:0 8px;font-family:var(--font-family);font-weight:700;font-size:14px;color:var(--accent);text-align:center">{{ r.pts }}</div>
              </div>
            </div>
          </div>

          <template v-if="ch.hasResults">
            <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3);text-transform:uppercase;letter-spacing:.04em;margin:18px 0 10px">Partidos</div>
            <div style="display:flex;flex-direction:column;gap:8px">
              <div v-for="(g, i) in ch.results" :key="i" style="display:grid;grid-template-columns:70px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--stroke-1);border-radius:6px">
                <span style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3)">{{ g.date }}</span>
                <span style="font-family:var(--font-family);font-weight:600;font-size:14px;color:var(--fg-1)">{{ g.home }} <span style="color:var(--fg-3);font-weight:400">vs</span> {{ g.away }}</span>
                <span style="font-family:var(--font-family);font-weight:700;font-size:14px" :style="{ color: g.scoreColor }">{{ g.scoreLabel }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
