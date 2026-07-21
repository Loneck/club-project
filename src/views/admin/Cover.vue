<script setup>
import { useClubStore } from '@/stores/club'

const store = useClubStore()

const heroOptions = [
  { value: 'split', label: 'Dividido (logo al costado)' },
  { value: 'centered', label: 'Centrado (logo arriba)' },
  { value: 'stat', label: 'Con estadísticas' },
]
</script>

<template>
  <div style="max-width:640px">
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:20px">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      Estos textos se muestran en el hero de la página de inicio.
    </div>
    <div class="gv-card">
      <div class="gv-card__body">
        <div class="gv-field">
          <label class="gv-label">Insignia / etiqueta</label>
          <input class="gv-input" :value="store.db.cover.badge" @input="store.setCover('badge', $event.target.value)" />
        </div>
        <div class="gv-field">
          <label class="gv-label">Título principal</label>
          <input class="gv-input" :value="store.db.cover.title" @input="store.setCover('title', $event.target.value)" />
        </div>
        <div class="gv-field">
          <label class="gv-label">Subtítulo</label>
          <textarea class="gv-input" style="height:80px;padding:8px;resize:vertical" :value="store.db.cover.subtitle" @input="store.setCover('subtitle', $event.target.value)"></textarea>
        </div>
        <div class="gv-field">
          <label class="gv-label">Estilo del hero</label>
          <select class="gv-input" :value="store.heroVariant" @change="store.setHeroVariant($event.target.value)">
            <option v-for="o in heroOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div class="gv-field">
          <label class="gv-label">Mensualidad por jugador (CLP)</label>
          <input class="gv-input" type="number" :value="store.fee" @input="store.setFee($event.target.value)" />
        </div>
        <div style="font-family:var(--font-family);font-size:12px;color:var(--fg-3)">
          Los cambios se guardan automáticamente. Usa <strong>Publicar</strong> (arriba a la derecha) para reflejarlos en el sitio.
        </div>
      </div>
    </div>
  </div>
</template>
