<script setup>
import { ref, reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()
const images = computed(() => store.db.gallery || [])

const modalOpen = ref(false)
const draft = reactive({})
const editingId = ref(null)

const fields = [
  { key: 'src', label: 'URL de la imagen', type: 'text', placeholder: 'https://… o /assets/mi-foto.jpg' },
  { key: 'caption', label: 'Descripción (opcional)', type: 'text' },
]

function openAdd() {
  editingId.value = null
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { src: '', caption: '' })
  modalOpen.value = true
}
function openEdit(img) {
  editingId.value = img.id
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { ...img })
  modalOpen.value = true
}
function save() {
  if (!draft.src) {
    store.showToast('Ingresa una URL de imagen')
    return
  }
  store.saveGalleryImage({ ...draft, id: editingId.value || undefined })
  modalOpen.value = false
}
function updateDraft(v) {
  Object.assign(draft, v)
}
</script>

<template>
  <div>
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:16px;align-items:flex-start">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      <div style="min-width:0;line-height:1.5">Recomendado: sube las fotos a la carpeta <strong>public/assets/</strong> del repo y aquí referencia su ruta (ej: <code>/assets/foto1.jpg</code>). También puedes pegar una URL externa.</div>
    </div>
    <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
      <button class="gv-btn gv-btn--pill gv-btn--primary" @click="openAdd"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Agregar imagen</button>
    </div>

    <div v-if="images.length" class="gallery-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <div v-for="img in images" :key="img.id" style="border:1px solid var(--stroke-1);border-radius:6px;overflow:hidden;background:#fff">
        <div style="aspect-ratio:4/3;background:#0E141B;position:relative">
          <img :src="img.src" :alt="img.caption" style="width:100%;height:100%;object-fit:cover;display:block" />
        </div>
        <div style="padding:10px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px">
          <span style="font-family:var(--font-family);font-size:13px;color:var(--fg-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ img.caption || 'Sin descripción' }}</span>
          <span style="display:flex;gap:4px;flex-shrink:0">
            <button class="gv-iconbtn" @click="openEdit(img)"><i class="fa-solid fa-pen" style="font-size:12px;color:var(--accent)"></i></button>
            <button class="gv-iconbtn" @click="store.deleteGalleryImage(img.id)"><i class="fa-solid fa-trash" style="font-size:12px;color:var(--danger)"></i></button>
          </span>
        </div>
      </div>
    </div>
    <div v-else style="font-family:var(--font-family);color:var(--fg-3);padding:8px 0">Aún no hay imágenes en la galería.</div>

    <EntityModal
      :open="modalOpen"
      :title="editingId ? 'Editar imagen' : 'Agregar imagen'"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } }
</style>
