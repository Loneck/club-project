<script setup>
import { computed } from 'vue'
import { useClubStore } from '@/stores/club'

const store = useClubStore()
const contact = computed(() => store.contactInfo)
</script>

<template>
  <div style="max-width:640px">
    <div class="gv-banner" style="border-color:var(--accent);background:var(--color-info-surface);margin-bottom:20px;align-items:flex-start">
      <div class="gv-banner__icon"><i class="fa-solid fa-circle-info" style="color:var(--accent)"></i></div>
      <div style="min-width:0;line-height:1.5">Estos datos aparecen en la página de Contacto y en el pie del sitio. El Instagram puede ser el usuario (ej: <code>@club.project.bsk</code>) o la URL completa.</div>
    </div>
    <div class="gv-card">
      <div class="gv-card__body">
        <div class="gv-field">
          <label class="gv-label">Sede / gimnasio</label>
          <input class="gv-input" :value="store.venue" @input="store.setVenue($event.target.value)" placeholder="Ej: Gimnasio Municipal Project" />
        </div>
        <div class="gv-field">
          <label class="gv-label">Correo de contacto</label>
          <input class="gv-input" type="email" :value="contact.email || ''" @input="store.setContactField('email', $event.target.value)" placeholder="contacto@clubproject.cl" />
        </div>
        <div class="gv-field">
          <label class="gv-label">Instagram</label>
          <input class="gv-input" :value="contact.instagram || ''" @input="store.setContactField('instagram', $event.target.value)" placeholder="@club.project.bsk" />
        </div>
        <div class="gv-field">
          <label class="gv-label">Teléfono</label>
          <input class="gv-input" :value="contact.phone || ''" @input="store.setContactField('phone', $event.target.value)" placeholder="+56 9 1234 5678" />
        </div>
        <div style="font-family:var(--font-family);font-size:12px;color:var(--fg-3)">
          Los cambios se guardan automáticamente. Usa <strong>Publicar</strong> para reflejarlos en el sitio.
        </div>
      </div>
    </div>
  </div>
</template>
