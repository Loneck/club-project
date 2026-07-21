<script setup>
import { ref, reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'
import { uploadImage } from '@/services/publish'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()
const images = computed(() => store.db.gallery || [])

const uploading = ref(false)
const fileInput = ref(null)

// Redimensiona la imagen en el navegador (máx 1600px, JPEG) y devuelve su base64.
function fileToResizedBase64(file, maxDim = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          const r = Math.min(maxDim / width, maxDim / height)
          width = Math.round(width * r)
          height = Math.round(height * r)
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1])
      }
      img.onerror = reject
      img.src = reader.result
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function onFile(e) {
  const file = e.target.files && e.target.files[0]
  e.target.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    store.showToast('Selecciona un archivo de imagen')
    return
  }
  uploading.value = true
  try {
    const base64 = await fileToResizedBase64(file)
    const rand = Math.random().toString(36).slice(2, 9)
    const { path } = await uploadImage(`g-${rand}.jpg`, base64)
    store.saveGalleryImage({ src: path, caption: '' })
    store.showToast('Imagen subida. Publica para mostrarla en el sitio (puede tardar ~1 min).')
  } catch (err) {
    store.showToast(err.message)
  } finally {
    uploading.value = false
  }
}

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
function remove(id) {
  if (window.confirm('¿Eliminar esta imagen?')) store.deleteGalleryImage(id)
}
</script>

<template>
  <div>
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:16px;align-items:flex-start">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      <div style="min-width:0;line-height:1.5"><strong>Subir imagen</strong> sube la foto al sitio automáticamente (se optimiza sola). También puedes <strong>Agregar por URL</strong> si la imagen ya está en internet. Tras subir, recuerda <strong>Publicar</strong>.</div>
    </div>
    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFile" />
    <div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px">
      <button class="gv-btn gv-btn--pill gv-btn--secondary" @click="openAdd">Agregar por URL</button>
      <button class="gv-btn gv-btn--pill gv-btn--primary" :disabled="uploading" @click="fileInput.click()">
        <i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-arrow-up-from-bracket'" style="margin-right:6px;font-size:12px"></i>
        {{ uploading ? 'Subiendo…' : 'Subir imagen' }}
      </button>
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
            <button class="gv-iconbtn" @click="remove(img.id)"><i class="fa-solid fa-trash" style="font-size:12px;color:var(--danger)"></i></button>
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
