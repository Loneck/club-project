<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useClubStore } from '@/stores/club'

const store = useClubStore()
const router = useRouter()

const cover = computed(() => store.db.cover)
const heroVariant = computed(() => store.heroVariant)

const heroStats = computed(() => [
  { value: String(store.categoryList.length), label: 'Categorías' },
  { value: String(store.db.players.length), label: 'Jugadores' },
  { value: String(store.db.championships.length), label: 'Campeonatos' },
  { value: '6', label: 'Entrenos / semana' },
])

// ——— Categorías ———
const categoryCards = computed(() =>
  store.categories.map((k) => {
    const t = store.db.trainings.find((x) => x.category === k)
    return {
      key: k,
      name: store.catLabel(k),
      tag: store.catShort(k).toUpperCase(),
      icon: store.catIcon(k),
      schedule: t ? `${t.days} · ${t.time}` : 'Horario por confirmar',
    }
  })
)

// ——— Entrenamientos ———
const trainingsView = computed(() =>
  store.db.trainings.map((t) => ({ ...t, catName: store.catLabel(t.category) }))
)

// ——— Campeonatos destacados ———
const champsView = computed(() =>
  store.db.championships.map((ch) => {
    const ranked = store.rankedStandings(ch)
    const rows = ranked.map((r) => ({
      rank: r.rank, team: r.team, pj: r.pj, pts: r.pts,
      rankColor: r.rank <= 3 ? 'var(--accent)' : 'var(--fg-3)',
      weight: r.team === 'Club Project' ? '700' : '600',
      rowBg: r.team === 'Club Project' ? 'var(--accent-subtle)' : '#fff',
    }))
    return { id: ch.id, name: ch.name, catLabel: store.catLabel(ch.category), mini: rows.slice(0, 4) }
  })
)

// ——— Carrusel: próximo partido POR campeonato ———
// Un slide por campeonato que tenga partidos programados; muestra el más cercano por fecha
// (prefiere de hoy en adelante; si todos pasaron, cae al más próximo disponible).
function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function isoOrLast(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '') ? s : '9999-99-99'
}
function nextGame(ch) {
  const up = ch.results
    .filter((r) => r.status === 'programado')
    .slice()
    .sort((a, b) => isoOrLast(a.date).localeCompare(isoOrLast(b.date)))
  if (!up.length) return null
  const today = todayIso()
  return up.find((g) => isoOrLast(g.date) >= today) || up[0]
}

const matches = computed(() => {
  const list = []
  store.db.championships.forEach((ch) => {
    const g = nextGame(ch)
    if (!g) return
    list.push({
      catLabel: store.catLabel(ch.category),
      champName: ch.name,
      home: g.home,
      away: g.away,
      homeIsClub: g.home === 'Club Project',
      homeInit: (g.home || '').slice(0, 3).toUpperCase(),
      awayInit: (g.away || '').slice(0, 3).toUpperCase(),
      date: store.formatDate(g.date),
    })
  })
  return list
})

const matchIdx = ref(0)
const safeIdx = computed(() => (matches.value.length ? matchIdx.value % matches.value.length : 0))
const currentMatch = computed(() => (matches.value.length ? matches.value[safeIdx.value] : null))
function matchNav(d) {
  const n = matches.value.length
  if (!n) return
  matchIdx.value = (matchIdx.value + d + n) % n
}

function goCategory(key) {
  router.push({ name: 'categoria', params: { cat: key } })
}
</script>

<template>
  <div class="cdsp-up">
    <!-- HERO: split -->
    <section v-if="heroVariant === 'split'"
      style="background:radial-gradient(1200px 500px at 78% 30%, rgba(0,155,217,.28), transparent 60%), linear-gradient(180deg,#0E141B,#0A0E13);color:#fff">
      <div class="hero-split" style="max-width:1180px;margin:0 auto;padding:clamp(44px,8vw,72px) 20px clamp(52px,9vw,80px);display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center">
        <div>
          <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border:1px solid rgba(127,211,242,.35);border-radius:999px;font-family:var(--font-family);font-weight:600;font-size:12px;color:#7FD3F2">
            <i class="fa-solid fa-basketball" style="font-size:11px"></i>{{ cover.badge }}
          </div>
          <h1 style="font-family:var(--font-family);font-weight:700;font-size:clamp(30px,6.5vw,46px);line-height:1.05;letter-spacing:-.02em;margin:20px 0 0;color:#fff">{{ cover.title }}</h1>
          <p style="font-family:var(--font-family);font-size:17px;line-height:1.55;color:rgba(255,255,255,.72);max-width:460px;margin:18px 0 0">{{ cover.subtitle }}</p>
          <div style="display:flex;gap:12px;margin-top:32px;flex-wrap:wrap">
            <button @click="router.push({ name: 'contacto' })" class="gv-btn gv-btn--pill gv-btn--primary" style="height:44px;padding:0 22px;font-size:15px">Quiero entrenar</button>
            <button @click="router.push({ name: 'entrenamientos' })" style="height:44px;padding:0 22px;font-family:var(--font-family);font-weight:600;font-size:15px;border-radius:999px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.28);cursor:pointer">Ver entrenamientos</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;justify-content:center;position:relative">
          <div style="position:absolute;width:min(340px,78vw);height:min(340px,78vw);border-radius:999px;background:radial-gradient(circle,rgba(0,175,242,.45),transparent 65%);animation:cdspGlow 5s ease-in-out infinite"></div>
          <img src="/assets/logo.png" alt="Escudo Club Project" style="position:relative;width:min(340px,78vw);height:auto;object-fit:contain;filter:drop-shadow(0 16px 40px rgba(0,0,0,.55))" />
        </div>
      </div>
    </section>

    <!-- HERO: centered -->
    <section v-else-if="heroVariant === 'centered'"
      style="background:radial-gradient(900px 480px at 50% 8%, rgba(0,155,217,.32), transparent 62%), linear-gradient(180deg,#0E141B,#0A0E13);color:#fff">
      <div style="max-width:820px;margin:0 auto;padding:clamp(44px,8vw,70px) 20px clamp(48px,9vw,76px);text-align:center;display:flex;flex-direction:column;align-items:center">
        <div style="position:relative;margin-bottom:26px">
          <div style="position:absolute;inset:-24px;border-radius:999px;background:radial-gradient(circle,rgba(0,175,242,.5),transparent 65%);animation:cdspGlow 5s ease-in-out infinite"></div>
          <img src="/assets/logo.png" alt="Escudo Club Project" style="position:relative;width:min(184px,52vw);height:auto;object-fit:contain;filter:drop-shadow(0 12px 30px rgba(0,0,0,.5))" />
        </div>
        <div style="display:inline-flex;align-items:center;gap:8px;padding:5px 12px;border:1px solid rgba(127,211,242,.35);border-radius:999px;font-family:var(--font-family);font-weight:600;font-size:12px;color:#7FD3F2">{{ cover.badge }}</div>
        <h1 style="font-family:var(--font-family);font-weight:700;font-size:clamp(30px,7vw,48px);line-height:1.05;letter-spacing:-.02em;margin:18px 0 0;color:#fff">{{ cover.title }}</h1>
        <p style="font-family:var(--font-family);font-size:17px;line-height:1.55;color:rgba(255,255,255,.72);max-width:520px;margin:16px auto 0">{{ cover.subtitle }}</p>
        <div style="display:flex;gap:12px;margin-top:30px;justify-content:center;flex-wrap:wrap">
          <button @click="router.push({ name: 'contacto' })" class="gv-btn gv-btn--pill gv-btn--primary" style="height:44px;padding:0 22px;font-size:15px">Quiero entrenar</button>
          <button @click="router.push({ name: 'entrenamientos' })" style="height:44px;padding:0 22px;font-family:var(--font-family);font-weight:600;font-size:15px;border-radius:999px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,.28);cursor:pointer">Ver entrenamientos</button>
        </div>
      </div>
    </section>

    <!-- HERO: stat -->
    <section v-else
      style="background:radial-gradient(1000px 460px at 20% 20%, rgba(0,155,217,.26), transparent 60%), linear-gradient(180deg,#0E141B,#0A0E13);color:#fff">
      <div style="max-width:1180px;margin:0 auto;padding:66px 24px 0;display:flex;align-items:center;gap:20px">
        <img src="/assets/logo.png" alt="Escudo" style="width:96px;height:96px;object-fit:contain" />
        <div>
          <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:#7FD3F2">{{ cover.badge }}</div>
          <h1 style="font-family:var(--font-family);font-weight:700;font-size:clamp(28px,6vw,42px);line-height:1.05;letter-spacing:-.02em;margin:8px 0 0;color:#fff">{{ cover.title }}</h1>
        </div>
      </div>
      <div style="max-width:1180px;margin:0 auto;padding:22px 24px 66px">
        <p style="font-family:var(--font-family);font-size:16px;line-height:1.55;color:rgba(255,255,255,.72);max-width:560px">{{ cover.subtitle }}</p>
        <div class="hero-stats" style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:34px">
          <div v-for="s in heroStats" :key="s.label" style="padding:18px 20px;border:1px solid rgba(255,255,255,.12);border-radius:6px;background:rgba(255,255,255,.03)">
            <div style="font-family:var(--font-family);font-weight:700;font-size:32px;color:#fff;letter-spacing:-.02em">{{ s.value }}</div>
            <div style="font-family:var(--font-family);font-weight:600;font-size:13px;color:rgba(255,255,255,.6);margin-top:4px">{{ s.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Próximo partido (carrusel) -->
    <section style="max-width:1180px;margin:0 auto;padding:56px 24px 0">
      <div style="background:#0E141B;border-radius:8px;padding:18px 22px;color:#fff;position:relative;overflow:hidden">
        <div style="position:absolute;right:-60px;top:-40px;width:200px;height:200px;border-radius:999px;background:radial-gradient(circle,rgba(0,155,217,.28),transparent 65%)"></div>
        <div v-if="currentMatch" style="position:relative;display:flex;align-items:center;gap:28px;flex-wrap:wrap">
          <div style="min-width:172px">
            <div style="display:flex;align-items:center;gap:8px;font-family:var(--font-family);font-weight:600;font-size:11px;color:#7FD3F2;letter-spacing:.04em;text-transform:uppercase"><i class="fa-solid fa-calendar-check" style="font-size:11px"></i>Próximo partido</div>
            <div style="display:inline-flex;margin-top:10px;padding:3px 10px;border:1px solid rgba(127,211,242,.35);border-radius:999px;font-family:var(--font-family);font-weight:600;font-size:11px;color:#7FD3F2">{{ currentMatch.catLabel }}</div>
            <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:rgba(255,255,255,.5);margin-top:8px">{{ currentMatch.champName }}</div>
          </div>
          <div style="display:flex;align-items:center;gap:16px;margin:0 auto">
            <div style="display:flex;flex-direction:column;align-items:center;gap:7px">
              <img v-if="currentMatch.homeIsClub" src="/assets/logo.png" alt="Project" style="width:44px;height:44px;object-fit:contain" />
              <div v-else style="width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-family:var(--font-family);font-weight:700;font-size:13px">{{ currentMatch.homeInit }}</div>
              <span style="font-family:var(--font-family);font-weight:700;font-size:12px">{{ currentMatch.home }}</span>
            </div>
            <span style="font-family:var(--font-family);font-weight:800;font-size:15px;color:rgba(255,255,255,.6)">VS</span>
            <div style="display:flex;flex-direction:column;align-items:center;gap:7px">
              <img v-if="currentMatch.away === 'Club Project'" src="/assets/logo.png" alt="Project" style="width:44px;height:44px;object-fit:contain" />
              <div v-else style="width:44px;height:44px;border-radius:999px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center;font-family:var(--font-family);font-weight:700;font-size:13px">{{ currentMatch.awayInit }}</div>
              <span style="font-family:var(--font-family);font-weight:700;font-size:12px">{{ currentMatch.away }}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:12px">
            <div style="font-family:var(--font-family);font-weight:800;font-size:24px;letter-spacing:-.02em">{{ currentMatch.date }}</div>
            <div v-if="matches.length > 1" style="display:flex;align-items:center;gap:10px">
              <div style="display:flex;gap:6px">
                <button v-for="(m, i) in matches" :key="i" @click="matchIdx = i" aria-label="Ir a partido"
                  :style="`width:8px;height:8px;border-radius:999px;border:0;cursor:pointer;padding:0;background:${i === safeIdx ? '#7FD3F2' : 'rgba(255,255,255,.25)'}`"></button>
              </div>
              <button @click="matchNav(-1)" aria-label="Anterior" style="width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer"><i class="fa-solid fa-chevron-left" style="font-size:11px"></i></button>
              <button @click="matchNav(1)" aria-label="Siguiente" style="width:28px;height:28px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);color:#fff;cursor:pointer"><i class="fa-solid fa-chevron-right" style="font-size:11px"></i></button>
            </div>
          </div>
        </div>
        <div v-else style="position:relative;display:flex;align-items:center;gap:12px;color:rgba(255,255,255,.7);font-family:var(--font-family);font-size:14px;font-weight:600">
          <i class="fa-solid fa-calendar-xmark" style="color:#7FD3F2"></i>No hay próximos partidos programados.
        </div>
      </div>
    </section>

    <!-- Campeonatos destacados -->
    <section style="max-width:1180px;margin:0 auto;padding:56px 24px 0">
      <div style="display:flex;align-items:flex-end;justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div>
          <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Competencias</div>
          <h2 style="font-family:var(--font-family);font-weight:700;font-size:28px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 0">Campeonatos en juego</h2>
        </div>
        <button @click="router.push({ name: 'campeonatos' })" class="gv-btn gv-btn--pill gv-btn--tertiary" style="height:34px">Ver todos los campeonatos</button>
      </div>
      <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px">
        <div v-for="ch in champsView" :key="ch.id" style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;overflow:hidden">
          <div style="padding:14px 16px;border-bottom:1px solid var(--stroke-1)">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
              <span class="gv-badge" style="border-color:var(--accent);color:var(--accent)">{{ ch.catLabel }}</span>
              <i class="fa-solid fa-trophy" style="color:var(--accent);font-size:13px"></i>
            </div>
            <div style="font-family:var(--font-family);font-weight:700;font-size:14px;color:var(--fg-1);margin-top:10px;line-height:1.3">{{ ch.name }}</div>
          </div>
          <div style="padding:6px 0 8px">
            <div style="display:grid;grid-template-columns:26px 1fr 36px 42px;padding:6px 14px;font-family:var(--font-family);font-weight:600;font-size:11px;color:var(--fg-3)">
              <div>#</div><div>Equipo</div><div style="text-align:center">PJ</div><div style="text-align:center">Pts</div>
            </div>
            <div v-for="r in ch.mini" :key="r.rank" style="display:grid;grid-template-columns:26px 1fr 36px 42px;padding:7px 14px;align-items:center" :style="{ background: r.rowBg }">
              <div style="font-family:var(--font-family);font-weight:700;font-size:12px" :style="{ color: r.rankColor }">{{ r.rank }}</div>
              <div style="font-family:var(--font-family);font-size:13px;color:var(--fg-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis" :style="{ fontWeight: r.weight }">{{ r.team }}</div>
              <div style="font-family:var(--font-family);font-size:12px;color:var(--fg-2);text-align:center">{{ r.pj }}</div>
              <div style="font-family:var(--font-family);font-weight:700;font-size:13px;color:var(--accent);text-align:center">{{ r.pts }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categorías -->
    <section style="max-width:1180px;margin:0 auto;padding:64px 24px 8px">
      <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Nuestras categorías</div>
      <h2 style="font-family:var(--font-family);font-weight:700;font-size:28px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 0">Un equipo para cada jugador</h2>
      <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:28px">
        <button v-for="c in categoryCards" :key="c.key" @click="goCategory(c.key)"
          style="text-align:left;background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:0;overflow:hidden;cursor:pointer;transition:box-shadow .15s,transform .15s" class="cat-card">
          <div style="height:112px;background:linear-gradient(135deg,#0E141B,#123);display:flex;align-items:center;justify-content:center;position:relative">
            <i :class="c.icon" style="font-size:40px;color:#7FD3F2;opacity:.9"></i>
            <span style="position:absolute;top:12px;right:12px;font-family:var(--font-family);font-weight:700;font-size:11px;color:rgba(255,255,255,.5);letter-spacing:.08em">{{ c.tag }}</span>
          </div>
          <div style="padding:18px">
            <div style="font-family:var(--font-family);font-weight:700;font-size:17px;color:var(--fg-1)">{{ c.name }}</div>
            <div style="font-family:var(--font-family);font-size:13px;color:var(--fg-2);margin-top:6px;line-height:1.5">{{ c.schedule }}</div>
            <div style="display:inline-flex;align-items:center;gap:6px;font-family:var(--font-family);font-weight:600;font-size:13px;color:var(--accent);margin-top:14px">Ver plantel<i class="fa-solid fa-arrow-right-long" style="font-size:11px"></i></div>
          </div>
        </button>
      </div>
    </section>

    <!-- Entrenamientos + Mensualidad -->
    <section style="max-width:1180px;margin:0 auto;padding:56px 24px">
      <div class="grid-2" style="display:grid;grid-template-columns:1.15fr .85fr;gap:24px;align-items:stretch">
        <div>
          <h2 style="font-family:var(--font-family);font-weight:700;font-size:22px;color:var(--fg-1);letter-spacing:-.01em;margin:0 0 16px">Entrenamientos de la semana</h2>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div v-for="t in trainingsView" :key="t.id" style="display:flex;align-items:center;gap:16px;background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:14px 16px">
              <div style="width:44px;height:44px;border-radius:6px;background:var(--accent-subtle);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-basketball" style="color:var(--accent);font-size:18px"></i></div>
              <div style="min-width:0;flex:1">
                <div style="font-family:var(--font-family);font-weight:700;font-size:15px;color:var(--fg-1)">{{ t.catName }}</div>
                <div style="font-family:var(--font-family);font-size:13px;color:var(--fg-2);margin-top:2px">{{ t.days }} · {{ t.place }}</div>
              </div>
              <div style="font-family:var(--font-family);font-weight:700;font-size:15px;color:var(--accent);white-space:nowrap">{{ t.time }}</div>
            </div>
          </div>
        </div>
        <div style="background:#0E141B;border-radius:8px;padding:24px;color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column">
          <div style="position:absolute;right:-60px;top:-40px;width:200px;height:200px;border-radius:999px;background:radial-gradient(circle,rgba(0,155,217,.3),transparent 65%)"></div>
          <div style="position:relative;display:flex;flex-direction:column;flex:1">
            <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:#7FD3F2;letter-spacing:.04em;text-transform:uppercase">Mensualidad</div>
            <div style="display:flex;align-items:baseline;gap:6px;margin-top:12px"><span style="font-family:var(--font-family);font-weight:800;font-size:42px;color:#fff;letter-spacing:-.02em">{{ store.feeLabel }}</span><span style="font-family:var(--font-family);font-weight:600;font-size:14px;color:rgba(255,255,255,.6)">/ mes</span></div>
            <div style="font-family:var(--font-family);font-weight:600;font-size:13px;color:rgba(255,255,255,.6);margin-top:2px">por jugador</div>
            <p style="font-family:var(--font-family);font-size:14px;color:rgba(255,255,255,.7);margin:14px 0 0;line-height:1.55">Sin abonos ni matrícula. La cuota mensual cubre entrenamientos, participación en campeonatos y equipamiento del club.</p>
            <button @click="router.push({ name: 'contacto' })" class="gv-btn gv-btn--pill gv-btn--primary" style="width:100%;height:42px;margin-top:auto">Quiero inscribirme</button>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section style="background:#0E141B;color:#fff">
      <div style="max-width:1180px;margin:0 auto;padding:56px 24px;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap">
        <div>
          <h2 style="font-family:var(--font-family);font-weight:700;font-size:26px;letter-spacing:-.02em;margin:0">¿Listo para volar con el Project?</h2>
          <p style="font-family:var(--font-family);font-size:15px;color:rgba(255,255,255,.7);margin:8px 0 0">Sumate a los entrenamientos. Todas las categorías, todos los niveles.</p>
        </div>
        <button @click="router.push({ name: 'contacto' })" class="gv-btn gv-btn--pill gv-btn--primary" style="height:46px;padding:0 26px;font-size:15px">Cómo unirse</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cat-card:hover { box-shadow: var(--shadow-btn-primary-hover); transform: translateY(-3px); }
@media (max-width: 860px) {
  .grid-3 { grid-template-columns: 1fr !important; }
  .grid-2 { grid-template-columns: 1fr !important; }
  .hero-split { grid-template-columns: 1fr !important; }
  .hero-stats { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>
