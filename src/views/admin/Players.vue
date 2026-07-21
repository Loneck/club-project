<script setup>
import { ref, reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()

const filter = ref('all')
const filters = computed(() => [
  { k: 'all', l: 'Todos' },
  ...store.categoryList.map((c) => ({ k: c.key, l: c.short })),
])

const rows = computed(() =>
  store.db.players
    .filter((p) => filter.value === 'all' || p.category === filter.value)
    .slice()
    .sort((a, b) => a.category.localeCompare(b.category) || a.number - b.number)
    .map((p) => ({ ...p, catLabel: store.catShort(p.category) }))
)

const modalOpen = ref(false)
const draft = reactive({})
const editingId = ref(null)

const fields = computed(() => [
  { key: 'name', label: 'Nombre', type: 'text' },
  { key: 'number', label: 'Dorsal', type: 'number' },
  { key: 'position', label: 'Posición', type: 'select', options: store.positions.map((p) => ({ value: p, label: p })) },
  { key: 'category', label: 'Categoría', type: 'select', options: store.catOptions },
])

function openAdd() {
  editingId.value = null
  Object.keys(draft).forEach((k) => delete draft[k])
  const defaultCat = filter.value === 'all' ? (store.categoryList[0] ? store.categoryList[0].key : '') : filter.value
  Object.assign(draft, { name: '', number: 0, position: 'Base', category: defaultCat })
  modalOpen.value = true
}
function openEdit(p) {
  editingId.value = p.id
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { ...p })
  modalOpen.value = true
}
function save() {
  store.savePlayer({ ...draft, id: editingId.value || undefined })
  modalOpen.value = false
}
function updateDraft(v) {
  Object.assign(draft, v)
}
function remove(id) {
  if (window.confirm('¿Eliminar este jugador?')) store.deletePlayer(id)
}
</script>

<template>
  <div>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;align-items:center">
      <button
        v-for="f in filters"
        :key="f.k"
        class="gv-btn gv-btn--pill"
        :class="filter === f.k ? 'gv-btn--primary' : 'gv-btn--secondary'"
        style="height:32px;padding:0 14px"
        @click="filter = f.k"
      >{{ f.l }}</button>
      <button class="gv-btn gv-btn--pill gv-btn--primary" style="height:32px;margin-left:auto" @click="openAdd"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Nuevo jugador</button>
    </div>
    <div class="table-scroll">
    <div class="gv-table">
      <div class="gv-table__hdr" style="grid-template-columns:70px 1.6fr 1fr 1.2fr 96px">
        <div class="gv-table__hcell">Dorsal</div><div class="gv-table__hcell">Nombre</div><div class="gv-table__hcell">Posición</div><div class="gv-table__hcell">Categoría</div><div class="gv-table__hcell">Acciones</div>
      </div>
      <div v-for="p in rows" :key="p.id" class="gv-table__row" style="grid-template-columns:70px 1.6fr 1fr 1.2fr 96px">
        <div class="gv-table__cell" style="font-weight:700;color:var(--accent)">#{{ p.number }}</div>
        <div class="gv-table__cell" style="font-weight:700;color:var(--fg-1)">{{ p.name }}</div>
        <div class="gv-table__cell">{{ p.position }}</div>
        <div class="gv-table__cell">{{ p.catLabel }}</div>
        <div class="gv-table__cell" style="gap:6px">
          <button class="gv-iconbtn" @click="openEdit(p)" title="Editar"><i class="fa-solid fa-pen" style="font-size:13px;color:var(--accent)"></i></button>
          <button class="gv-iconbtn" @click="remove(p.id)" title="Eliminar"><i class="fa-solid fa-trash" style="font-size:13px;color:var(--danger)"></i></button>
        </div>
      </div>
      <div v-if="!rows.length" style="padding:16px;font-family:var(--font-family);color:var(--fg-3)">No hay jugadores en esta categoría.</div>
    </div>
    </div>

    <EntityModal
      :open="modalOpen"
      :title="editingId ? 'Editar jugador' : 'Nuevo jugador'"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />
  </div>
</template>
