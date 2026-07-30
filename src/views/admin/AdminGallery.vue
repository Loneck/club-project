<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useClubStore } from '@/stores/club'
import { uploadImage } from '@/services/publish'
import EntityModal from '@/components/EntityModal.vue'

const store = useClubStore()
const images = computed(() => store.db.gallery || [])

// Álbum activo: destino de las fotos que se suban y filtro de la grilla.
// '' = todos los álbumes, 'none' = solo las fotos sin álbum.
const activeAlbum = ref('')

// Las fotos nuevas caen en el álbum activo; con "Todos" o "Sin álbum" quedan sin asignar.
const uploadAlbum = computed(() => (activeAlbum.value === 'none' ? '' : activeAlbum.value))

// El álbum activo puede desaparecer al eliminarlo o al descartar los cambios.
watch(
  () => store.albumList,
  () => {
    if (activeAlbum.value && activeAlbum.value !== 'none' && !store.albumName(activeAlbum.value)) {
      activeAlbum.value = ''
    }
  },
  { deep: true }
)

const albumRows = computed(() =>
  store.sortedAlbums.map((a) => ({ ...a, count: store.albumUsage(a.id).images }))
)
const looseCount = computed(() => images.value.filter((i) => !i.album || !store.albumName(i.album)).length)

const visibleImages = computed(() => {
  if (activeAlbum.value === 'none') return images.value.filter((i) => !i.album || !store.albumName(i.album))
  if (activeAlbum.value) return images.value.filter((i) => i.album === activeAlbum.value)
  return images.value
})

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
    store.saveGalleryImage({ src: path, caption: '', album: uploadAlbum.value })
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

const fields = computed(() => [
  { key: 'src', label: 'URL de la imagen', type: 'text', placeholder: 'https://… o /assets/mi-foto.jpg' },
  { key: 'caption', label: 'Descripción (opcional)', type: 'text' },
  { key: 'album', label: 'Álbum', type: 'select', options: [{ value: '', label: 'Sin álbum' }, ...store.albumOptions] },
])

function openAdd() {
  editingId.value = null
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { src: '', caption: '', album: uploadAlbum.value })
  modalOpen.value = true
}
function openEdit(img) {
  editingId.value = img.id
  Object.keys(draft).forEach((k) => delete draft[k])
  Object.assign(draft, { src: img.src, caption: img.caption || '', album: img.album || '' })
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

// ——— Álbumes ———
const albumModalOpen = ref(false)
const albumDraft = reactive({})
const editingAlbumId = ref(null)

const albumFields = [
  { key: 'name', label: 'Nombre del álbum', type: 'text', placeholder: 'Ej: Final Liga Regional 2026' },
  { key: 'date', label: 'Fecha (opcional, ordena los álbumes)', type: 'date' },
]

function openAddAlbum() {
  editingAlbumId.value = null
  Object.keys(albumDraft).forEach((k) => delete albumDraft[k])
  Object.assign(albumDraft, { name: '', date: '' })
  albumModalOpen.value = true
}
function openEditAlbum(a) {
  editingAlbumId.value = a.id
  Object.keys(albumDraft).forEach((k) => delete albumDraft[k])
  Object.assign(albumDraft, { name: a.name, date: a.date || '' })
  albumModalOpen.value = true
}
function saveAlbum() {
  if (store.saveAlbum({ ...albumDraft, id: editingAlbumId.value || undefined })) {
    albumModalOpen.value = false
  }
}
function updateAlbumDraft(v) {
  Object.assign(albumDraft, v)
}
function removeAlbum(a) {
  const warn = a.count
    ? `¿Eliminar el álbum "${a.name}"? Sus ${a.count} foto(s) no se borran: quedan sin álbum.`
    : `¿Eliminar el álbum "${a.name}"?`
  if (!window.confirm(warn)) return
  store.deleteAlbum(a.id)
}
</script>

<template>
  <div>
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:16px;align-items:flex-start">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      <div style="min-width:0;line-height:1.5"><strong>Subir imagen</strong> sube la foto al sitio automáticamente (se optimiza sola). También puedes <strong>Agregar por URL</strong> si la imagen ya está en internet. Las fotos se agrupan por <strong>álbum</strong>: elige uno arriba y las que subas caerán ahí. Tras subir, recuerda <strong>Publicar</strong>.</div>
    </div>

    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:12px;flex-wrap:wrap">
      <div style="font-family:var(--font-family);font-weight:700;font-size:15px;color:var(--fg-1)">Álbumes</div>
      <button class="gv-btn gv-btn--pill gv-btn--secondary" @click="openAddAlbum"><i class="fa-solid fa-plus" style="margin-right:6px;font-size:12px"></i>Nuevo álbum</button>
    </div>

    <div class="table-scroll" style="margin-bottom:24px">
    <div class="gv-table">
      <div class="gv-table__hdr" style="grid-template-columns:1.8fr 1fr 90px 96px">
        <div class="gv-table__hcell">Nombre</div><div class="gv-table__hcell">Fecha</div><div class="gv-table__hcell">Fotos</div><div class="gv-table__hcell">Acciones</div>
      </div>
      <div v-for="a in albumRows" :key="a.id" class="gv-table__row" style="grid-template-columns:1.8fr 1fr 90px 96px">
        <div class="gv-table__cell" style="font-weight:700;color:var(--fg-1)">{{ a.name }}</div>
        <div class="gv-table__cell" style="color:var(--fg-2)">{{ store.formatDateLong(a.date) || '—' }}</div>
        <div class="gv-table__cell">{{ a.count }}</div>
        <div class="gv-table__cell" style="gap:6px">
          <button class="gv-iconbtn" title="Editar" @click="openEditAlbum(a)"><i class="fa-solid fa-pen" style="font-size:13px;color:var(--accent)"></i></button>
          <button class="gv-iconbtn" title="Eliminar" @click="removeAlbum(a)"><i class="fa-solid fa-trash" style="font-size:13px;color:var(--danger)"></i></button>
        </div>
      </div>
      <div v-if="!albumRows.length" style="padding:16px;font-family:var(--font-family);color:var(--fg-3)">Aún no hay álbumes. Sin álbumes, las fotos se muestran juntas en el sitio.</div>
    </div>
    </div>

    <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFile" />
    <div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="gv-field" style="min-width:220px;margin:0">
        <label class="gv-label">Álbum</label>
        <select v-model="activeAlbum" class="gv-input">
          <option value="">Todos los álbumes</option>
          <option v-for="o in store.albumOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          <option value="none">Sin álbum ({{ looseCount }})</option>
        </select>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="gv-btn gv-btn--pill gv-btn--secondary" @click="openAdd">Agregar por URL</button>
        <button class="gv-btn gv-btn--pill gv-btn--primary" :disabled="uploading" @click="fileInput.click()">
          <i class="fa-solid" :class="uploading ? 'fa-spinner fa-spin' : 'fa-arrow-up-from-bracket'" style="margin-right:6px;font-size:12px"></i>
          {{ uploading ? 'Subiendo…' : 'Subir imagen' }}
        </button>
      </div>
    </div>
    <div v-if="uploadAlbum" style="font-family:var(--font-family);font-size:12px;color:var(--fg-3);margin:-8px 0 16px">Las fotos que subas se guardarán en <strong>{{ store.albumName(uploadAlbum) }}</strong>.</div>

    <div v-if="visibleImages.length" class="gallery-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
      <div v-for="img in visibleImages" :key="img.id" style="border:1px solid var(--stroke-1);border-radius:6px;overflow:hidden;background:#fff">
        <div style="aspect-ratio:4/3;background:#0E141B;position:relative">
          <img :src="img.src" :alt="img.caption" style="width:100%;height:100%;object-fit:cover;display:block" />
          <span v-if="!activeAlbum" style="position:absolute;left:8px;bottom:8px;max-width:calc(100% - 16px);padding:3px 9px;border-radius:999px;background:rgba(10,14,19,.82);font-family:var(--font-family);font-weight:600;font-size:11px;color:#7FD3F2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ store.albumName(img.album) || 'Sin álbum' }}</span>
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
    <div v-else style="font-family:var(--font-family);color:var(--fg-3);padding:8px 0">
      {{ images.length ? 'Este álbum aún no tiene fotos.' : 'Aún no hay imágenes en la galería.' }}
    </div>

    <EntityModal
      :open="modalOpen"
      :title="editingId ? 'Editar imagen' : 'Agregar imagen'"
      :fields="fields"
      :model-value="draft"
      @update:model-value="updateDraft"
      @save="save"
      @close="modalOpen = false"
    />

    <EntityModal
      :open="albumModalOpen"
      :title="editingAlbumId ? 'Editar álbum' : 'Nuevo álbum'"
      :fields="albumFields"
      :model-value="albumDraft"
      @update:model-value="updateAlbumDraft"
      @save="saveAlbum"
      @close="albumModalOpen = false"
    />
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } }
</style>
