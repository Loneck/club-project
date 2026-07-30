<script setup>
import { computed } from 'vue'
import { useClubStore } from '@/stores/club'

const store = useClubStore()
const images = computed(() => store.db.gallery || [])

// Un grupo por álbum. Sin álbumes creados (o con todas las fotos sin asignar) se devuelve
// un único grupo sin nombre, que se renderiza como la grilla plana de siempre.
const groups = computed(() => {
  const flat = [{ id: '', name: '', date: '', images: images.value }]
  if (!store.albumList.length) return flat
  const grouped = store.galleryAlbums
  return grouped.length === 1 && !grouped[0].id ? flat : grouped
})
</script>

<template>
  <div class="cdsp-up" style="max-width:1180px;margin:0 auto;padding:44px 24px 72px">
    <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Comunidad</div>
    <h1 style="font-family:var(--font-family);font-weight:700;font-size:32px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 6px">Galería</h1>
    <p style="font-family:var(--font-family);font-size:15px;color:var(--fg-2);max-width:620px">Momentos de entrenamientos y campeonatos del club.</p>

    <template v-if="images.length">
      <section v-for="group in groups" :key="group.id || 'sin-album'" :style="{ marginTop: group.name ? '36px' : '28px' }">
        <div v-if="group.name" class="album-head" style="display:flex;align-items:baseline;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <h2 style="font-family:var(--font-family);font-weight:700;font-size:20px;color:var(--fg-1);letter-spacing:-.01em;margin:0">{{ group.name }}</h2>
          <div style="font-family:var(--font-family);font-size:13px;color:var(--fg-3)">
            <span v-if="group.date">{{ store.formatDateLong(group.date) }} · </span>{{ group.images.length }} foto{{ group.images.length === 1 ? '' : 's' }}
          </div>
        </div>
        <div class="grid-3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
          <figure v-for="img in group.images" :key="img.id" style="margin:0;position:relative;aspect-ratio:4/3;border-radius:6px;overflow:hidden;border:1px solid var(--stroke-1);background:#0E141B">
            <img :src="img.src" :alt="img.caption || 'Foto del club'" style="width:100%;height:100%;object-fit:cover;display:block" loading="lazy" />
            <figcaption v-if="img.caption" style="position:absolute;left:0;right:0;bottom:0;padding:8px 10px;font-family:var(--font-family);font-size:12px;font-weight:600;color:#fff;background:linear-gradient(transparent,rgba(0,0,0,.65))">{{ img.caption }}</figcaption>
          </figure>
        </div>
      </section>
    </template>

    <div v-else class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-top:28px">
      <div class="gv-banner__icon"><i class="fa-solid fa-images" style="color:var(--accent)"></i></div>
      Aún no hay fotos en la galería. Se pueden agregar desde el panel de administración.
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .grid-3 { grid-template-columns: repeat(2, 1fr) !important; } }
@media (max-width: 640px) { .album-head { display: block !important; } .album-head > div { margin-top: 4px; } }
</style>
