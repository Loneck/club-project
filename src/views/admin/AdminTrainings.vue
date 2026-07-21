<script setup>
import { ref, reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()

const rows = computed(() =>
  store.db.trainings.map((t) => ({ ...t, catName: store.catLabel(t.category) }))
)

const modalOpen = ref(false)
const draft = reactive({})
const editingId = ref(null)

const fields = computed(() => [
  { key: 'category', label: 'Categoría', type: 'select', options: store.catOptions },
  { key: 'days', label: 'Días', type: 'text', placeholder: 'Ej: Martes y Jueves' },
  { key: 'time', label: 'Horario', type: 'text', placeholder: 'Ej: 20:00–22:00' },
  { key: 'place', label: 'Lugar', type: 'text' },
  { key: 'coach', label: 'Entrenador', type: 'text' },
])

function openAdd() {
  editingId.value = null
  Object.assign(draft, { category: 'adulto', days: '', time: '20:00–22:00', place: store.venue, coach: '' })
  modalOpen.value = true
}
function openEdit(t) {
  editingId.value = t.id
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { ...t })
  modalOpen.value = true
}
function save() {
  store.saveTraining({ ...draft, id: editingId.value || undefined })
  modalOpen.value = false
}
function updateDraft(v) {
  Object.assign(draft, v)
}
</script>

<template>
  <div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="gv-btn gv-btn--pill gv-btn--primary" @click="openAdd"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Nuevo entrenamiento</button>
    </div>
    <div class="gv-table">
      <div class="gv-table__hdr" style="grid-template-columns:1.2fr 1.3fr .9fr 1.2fr 1fr 96px">
        <div class="gv-table__hcell">Categoría</div><div class="gv-table__hcell">Días</div><div class="gv-table__hcell">Horario</div><div class="gv-table__hcell">Lugar</div><div class="gv-table__hcell">Entrenador</div><div class="gv-table__hcell">Acciones</div>
      </div>
      <div v-for="t in rows" :key="t.id" class="gv-table__row" style="grid-template-columns:1.2fr 1.3fr .9fr 1.2fr 1fr 96px">
        <div class="gv-table__cell" style="font-weight:700;color:var(--fg-1)">{{ t.catName }}</div>
        <div class="gv-table__cell">{{ t.days }}</div>
        <div class="gv-table__cell">{{ t.time }}</div>
        <div class="gv-table__cell">{{ t.place }}</div>
        <div class="gv-table__cell">{{ t.coach }}</div>
        <div class="gv-table__cell" style="gap:6px">
          <button class="gv-iconbtn" @click="openEdit(t)" title="Editar"><i class="fa-solid fa-pen" style="font-size:13px;color:var(--accent)"></i></button>
          <button class="gv-iconbtn" @click="store.deleteTraining(t.id)" title="Eliminar"><i class="fa-solid fa-trash" style="font-size:13px;color:var(--danger)"></i></button>
        </div>
      </div>
      <div v-if="!rows.length" style="padding:16px;font-family:var(--font-family);color:var(--fg-3)">No hay entrenamientos cargados.</div>
    </div>

    <EntityModal
      :open="modalOpen"
      :title="editingId ? 'Editar entrenamiento' : 'Nuevo entrenamiento'"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />
  </div>
</template>
