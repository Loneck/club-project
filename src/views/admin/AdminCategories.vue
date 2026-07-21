<script setup>
import { ref, reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()

const rows = computed(() =>
  store.categoryList.map((c) => ({ ...c, usage: store.categoryUsage(c.key) }))
)

const modalOpen = ref(false)
const draft = reactive({})
const editingKey = ref(null)

const fields = [
  { key: 'label', label: 'Nombre', type: 'text', placeholder: 'Ej: Sub-15' },
  { key: 'short', label: 'Nombre corto (chips y tablas)', type: 'text', placeholder: 'Ej: Sub-15' },
  { key: 'icon', label: 'Ícono (clase Font Awesome)', type: 'text', placeholder: 'fa-solid fa-basketball' },
  { key: 'desc', label: 'Descripción (página de la categoría)', type: 'textarea' },
]

function openAdd() {
  editingKey.value = null
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { label: '', short: '', icon: 'fa-solid fa-basketball', desc: '' })
  modalOpen.value = true
}
function openEdit(c) {
  editingKey.value = c.key
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { label: c.label, short: c.short, icon: c.icon, desc: c.desc })
  modalOpen.value = true
}
function save() {
  if (store.saveCategory({ ...draft, key: editingKey.value || undefined })) {
    modalOpen.value = false
  }
}
function updateDraft(v) {
  Object.assign(draft, v)
}
function remove(key) {
  if (window.confirm('¿Eliminar esta categoría?')) store.deleteCategory(key)
}
</script>

<template>
  <div>
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:16px;align-items:flex-start">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      <div style="min-width:0;line-height:1.5">Las categorías aparecen en el menú, la portada y los formularios. Solo puedes eliminar una si no tiene jugadores, entrenamientos ni campeonatos asociados. Íconos: usa una clase de <strong>Font Awesome</strong> (ej: <code>fa-solid fa-basketball</code>).</div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="gv-btn gv-btn--pill gv-btn--primary" @click="openAdd"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Nueva categoría</button>
    </div>

    <div class="table-scroll">
    <div class="gv-table">
      <div class="gv-table__hdr" style="grid-template-columns:56px 1.6fr 1fr 1.4fr 96px">
        <div class="gv-table__hcell">Ícono</div><div class="gv-table__hcell">Nombre</div><div class="gv-table__hcell">Corto</div><div class="gv-table__hcell">En uso</div><div class="gv-table__hcell">Acciones</div>
      </div>
      <div v-for="c in rows" :key="c.key" class="gv-table__row" style="grid-template-columns:56px 1.6fr 1fr 1.4fr 96px">
        <div class="gv-table__cell"><i :class="c.icon" style="color:var(--accent);font-size:16px"></i></div>
        <div class="gv-table__cell" style="font-weight:700;color:var(--fg-1)">{{ c.label }}</div>
        <div class="gv-table__cell">{{ c.short }}</div>
        <div class="gv-table__cell" style="color:var(--fg-3);font-size:12px">{{ c.usage.players }} jug · {{ c.usage.trainings }} entren · {{ c.usage.championships }} camp</div>
        <div class="gv-table__cell" style="gap:6px">
          <button class="gv-iconbtn" @click="openEdit(c)" title="Editar"><i class="fa-solid fa-pen" style="font-size:13px;color:var(--accent)"></i></button>
          <button class="gv-iconbtn" @click="remove(c.key)" title="Eliminar"><i class="fa-solid fa-trash" style="font-size:13px;color:var(--danger)"></i></button>
        </div>
      </div>
      <div v-if="!rows.length" style="padding:16px;font-family:var(--font-family);color:var(--fg-3)">No hay categorías. Crea la primera.</div>
    </div>
    </div>

    <EntityModal
      :open="modalOpen"
      :title="editingKey ? 'Editar categoría' : 'Nueva categoría'"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />
  </div>
</template>
