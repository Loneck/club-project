<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useClubStore } from '@/stores/club'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()

const activeId = ref(store.db.championships[0]?.id || null)

const champList = computed(() =>
  store.db.championships.map((ch) => ({ id: ch.id, name: ch.name, catLabel: store.catLabel(ch.category), active: ch.id === activeId.value }))
)

const activeChamp = computed(() => store.db.championships.find((x) => x.id === activeId.value) || null)

const rankedRows = computed(() => (activeChamp.value ? store.rankedStandings(activeChamp.value) : []))
const results = computed(() =>
  activeChamp.value
    ? activeChamp.value.results.map((g) => ({
        ...g,
        scoreLabel: g.status === 'finalizado' ? `${g.hs} – ${g.as}` : 'Programado',
        scoreColor: g.status === 'finalizado' ? 'var(--fg-1)' : 'var(--fg-3)',
      }))
    : []
)

// Asegura que siempre haya un campeonato activo válido
watch(
  () => store.db.championships.map((c) => c.id).join(','),
  () => {
    if (!store.db.championships.find((c) => c.id === activeId.value)) {
      activeId.value = store.db.championships[0] ? store.db.championships[0].id : null
    }
  }
)

// ——— Modal ———
const modalOpen = ref(false)
const modalKind = ref('champ') // champ | standing | result
const editingId = ref(null)
const draft = reactive({})

const modalTitle = computed(() => {
  const add = !editingId.value
  return {
    champ: add ? 'Nuevo campeonato' : 'Editar campeonato',
    standing: add ? 'Agregar equipo' : 'Editar equipo',
    result: add ? 'Nuevo partido' : 'Editar partido',
  }[modalKind.value]
})

const fields = computed(() => {
  if (modalKind.value === 'champ') {
    return [
      { key: 'name', label: 'Nombre del campeonato', type: 'text' },
      { key: 'category', label: 'Categoría', type: 'select', options: store.catOptions },
    ]
  }
  if (modalKind.value === 'standing') {
    return [
      { key: 'team', label: 'Equipo', type: 'text' },
      { key: 'pj', label: 'Partidos jugados', type: 'number' },
      { key: 'pg', label: 'Ganados', type: 'number' },
      { key: 'pp', label: 'Perdidos', type: 'number' },
    ]
  }
  return [
    { key: 'date', label: 'Fecha', type: 'text', placeholder: 'Ej: 12 Jul' },
    { key: 'home', label: 'Local', type: 'text' },
    { key: 'away', label: 'Visita', type: 'text' },
    { key: 'hs', label: 'Puntos local', type: 'number' },
    { key: 'as', label: 'Puntos visita', type: 'number' },
    { key: 'status', label: 'Estado', type: 'select', options: [
      { value: 'programado', label: 'Programado' },
      { value: 'finalizado', label: 'Finalizado' },
    ] },
  ]
})

function reset(obj) {
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, obj)
}
function open(kind, item) {
  modalKind.value = kind
  editingId.value = item ? item.id : null
  if (kind === 'champ') reset(item ? { ...item } : { name: '', category: store.categoryList[0] ? store.categoryList[0].key : '' })
  if (kind === 'standing') reset(item ? { ...item } : { team: '', pj: 0, pg: 0, pp: 0 })
  if (kind === 'result') reset(item ? { ...item } : { date: '', home: 'Club Project', away: '', hs: 0, as: 0, status: 'programado' })
  modalOpen.value = true
}
function save() {
  const payload = { ...draft, id: editingId.value || undefined }
  if (modalKind.value === 'champ') {
    store.saveChampionship(payload)
    if (!editingId.value) {
      // seleccionar el recién creado
      const last = store.db.championships[store.db.championships.length - 1]
      if (last) activeId.value = last.id
    }
  } else if (modalKind.value === 'standing') {
    store.saveStanding(activeId.value, payload)
  } else {
    store.saveResult(activeId.value, payload)
  }
  modalOpen.value = false
}
function updateDraft(v) {
  Object.assign(draft, v)
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="gv-btn gv-btn--pill gv-btn--primary" @click="open('champ')"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Nuevo campeonato</button>
    </div>

    <div class="champ-grid" style="display:grid;grid-template-columns:260px 1fr;gap:20px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:8px">
        <button
          v-for="cl in champList"
          :key="cl.id"
          @click="activeId = cl.id"
          style="text-align:left;padding:12px;border:1px solid var(--stroke-1);border-radius:6px;cursor:pointer;font-family:var(--font-family)"
          :style="{ background: cl.active ? 'var(--accent-subtle)' : '#fff' }"
        >
          <div style="font-weight:700;font-size:14px" :style="{ color: cl.active ? 'var(--accent)' : 'var(--fg-1)' }">{{ cl.name }}</div>
          <div style="font-weight:600;font-size:12px;color:var(--fg-3);margin-top:3px">{{ cl.catLabel }}</div>
        </button>
        <div v-if="!champList.length" style="font-family:var(--font-family);color:var(--fg-3);padding:8px">Sin campeonatos.</div>
      </div>

      <div v-if="activeChamp">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:10px;flex-wrap:wrap">
          <div style="font-family:var(--font-family);font-weight:700;font-size:18px;color:var(--fg-1)">{{ activeChamp.name }}</div>
          <div style="display:flex;gap:8px">
            <button class="gv-btn gv-btn--pill gv-btn--secondary" style="height:32px" @click="open('champ', activeChamp)">Editar torneo</button>
            <button class="gv-btn gv-btn--pill gv-btn--destructive-secondary" style="height:32px" @click="store.deleteChampionship(activeChamp.id)">Eliminar</button>
          </div>
        </div>

        <div style="font-family:var(--font-family);font-weight:600;font-size:13px;color:var(--fg-2);margin:16px 0 8px;display:flex;justify-content:space-between;align-items:center">
          Tabla de posiciones
          <button class="gv-btn gv-btn--pill gv-btn--tertiary" style="height:30px" @click="open('standing')"><i class="fa-solid fa-plus" style="margin-right:5px;font-size:11px"></i>Agregar equipo</button>
        </div>
        <div class="table-scroll">
        <div class="gv-table">
          <div class="gv-table__hdr" style="grid-template-columns:1.6fr 60px 60px 60px 64px 90px">
            <div class="gv-table__hcell">Equipo</div><div class="gv-table__hcell">PJ</div><div class="gv-table__hcell">PG</div><div class="gv-table__hcell">PP</div><div class="gv-table__hcell">Pts</div><div class="gv-table__hcell">Acciones</div>
          </div>
          <div v-for="r in rankedRows" :key="r.id" class="gv-table__row" style="grid-template-columns:1.6fr 60px 60px 60px 64px 90px">
            <div class="gv-table__cell" style="font-weight:700;color:var(--fg-1)">{{ r.team }}</div>
            <div class="gv-table__cell">{{ r.pj }}</div>
            <div class="gv-table__cell">{{ r.pg }}</div>
            <div class="gv-table__cell">{{ r.pp }}</div>
            <div class="gv-table__cell" style="font-weight:700;color:var(--accent)">{{ r.pts }}</div>
            <div class="gv-table__cell" style="gap:6px">
              <button class="gv-iconbtn" @click="open('standing', r)"><i class="fa-solid fa-pen" style="font-size:13px;color:var(--accent)"></i></button>
              <button class="gv-iconbtn" @click="store.deleteStanding(activeChamp.id, r.id)"><i class="fa-solid fa-trash" style="font-size:13px;color:var(--danger)"></i></button>
            </div>
          </div>
          <div v-if="!rankedRows.length" style="padding:16px;font-family:var(--font-family);color:var(--fg-3)">Sin equipos en la tabla.</div>
        </div>
        </div>

        <div style="font-family:var(--font-family);font-weight:600;font-size:13px;color:var(--fg-2);margin:22px 0 8px;display:flex;justify-content:space-between;align-items:center">
          Partidos
          <button class="gv-btn gv-btn--pill gv-btn--tertiary" style="height:30px" @click="open('result')"><i class="fa-solid fa-plus" style="margin-right:5px;font-size:11px"></i>Agregar partido</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div v-for="g in results" :key="g.id" style="display:grid;grid-template-columns:80px 1fr auto auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--stroke-1);border-radius:6px;background:#fff">
            <span style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3)">{{ g.date }}</span>
            <span style="font-family:var(--font-family);font-weight:600;font-size:14px;color:var(--fg-1);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ g.home }} vs {{ g.away }}</span>
            <span style="font-family:var(--font-family);font-weight:700;font-size:14px" :style="{ color: g.scoreColor }">{{ g.scoreLabel }}</span>
            <span style="display:flex;gap:4px">
              <button class="gv-iconbtn" @click="open('result', g)"><i class="fa-solid fa-pen" style="font-size:12px;color:var(--accent)"></i></button>
              <button class="gv-iconbtn" @click="store.deleteResult(activeChamp.id, g.id)"><i class="fa-solid fa-trash" style="font-size:12px;color:var(--danger)"></i></button>
            </span>
          </div>
          <div v-if="!results.length" style="font-family:var(--font-family);color:var(--fg-3);padding:4px 0">Sin partidos cargados.</div>
        </div>
      </div>
      <div v-else style="font-family:var(--font-family);color:var(--fg-3);padding:20px 0">Selecciona o crea un campeonato para editar su tabla.</div>
    </div>

    <EntityModal
      :open="modalOpen"
      :title="modalTitle"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />
  </div>
</template>

<style scoped>
@media (max-width: 760px) { .champ-grid { grid-template-columns: 1fr !important; } }
</style>
