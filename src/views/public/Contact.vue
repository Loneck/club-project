<script setup>
import { reactive, computed } from 'vue'
import { useClubStore } from '@/stores/club'

const store = useClubStore()
const contact = computed(() => store.contactInfo)

const joinSteps = [
  { n: 1, text: 'Escríbenos por Instagram o correo, o simplemente llega a un entrenamiento.' },
  { n: 2, text: 'Participa de una clase de prueba gratuita con la categoría que elijas.' },
  { n: 3, text: 'Formaliza tu inscripción y recibe la información del equipo.' },
]

const form = reactive({ name: '', contactInfo: '', cat: 'adulto', msg: '' })

function submit() {
  // Sitio estático sin backend: abrimos el cliente de correo con los datos.
  const to = contact.value.email || 'contacto@clubproject.cl'
  const subject = encodeURIComponent(`Inscripción — ${store.catLabel(form.cat)}`)
  const body = encodeURIComponent(
    `Nombre: ${form.name}\nContacto: ${form.contactInfo}\nCategoría: ${store.catLabel(form.cat)}\n\n${form.msg}`
  )
  window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  store.showToast('Solicitud lista. Se abrió tu correo para enviarla.')
}
</script>

<template>
  <div class="cdsp-up" style="max-width:1180px;margin:0 auto;padding:44px 24px 72px">
    <div style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--accent);letter-spacing:.04em;text-transform:uppercase">Sumate al club</div>
    <h1 style="font-family:var(--font-family);font-weight:700;font-size:32px;color:var(--fg-1);letter-spacing:-.02em;margin:8px 0 6px">Contacto y cómo unirse</h1>
    <p style="font-family:var(--font-family);font-size:15px;color:var(--fg-2);max-width:620px">¿Quieres entrenar con nosotros? Escríbenos o llega directamente a un entrenamiento. Todos los niveles son bienvenidos.</p>

    <div class="grid-2" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:28px;align-items:start">
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:18px">
          <h2 style="font-family:var(--font-family);font-weight:700;font-size:16px;color:var(--fg-1);margin:0 0 12px">Pasos para inscribirte</h2>
          <div style="display:flex;flex-direction:column;gap:12px">
            <div v-for="js in joinSteps" :key="js.n" style="display:flex;gap:12px;align-items:flex-start">
              <div style="width:26px;height:26px;border-radius:999px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--font-family);font-weight:700;font-size:13px;flex-shrink:0">{{ js.n }}</div>
              <div style="font-family:var(--font-family);font-size:14px;color:var(--fg-2);line-height:1.5;padding-top:3px">{{ js.text }}</div>
            </div>
          </div>
        </div>
        <div style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:18px">
          <div style="display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <h2 style="font-family:var(--font-family);font-weight:700;font-size:16px;color:var(--fg-1);margin:0">Mensualidad</h2>
            <div style="display:flex;align-items:baseline;gap:5px"><span style="font-family:var(--font-family);font-weight:800;font-size:26px;color:var(--accent)">{{ store.feeLabel }}</span><span style="font-family:var(--font-family);font-weight:600;font-size:12px;color:var(--fg-3)">/ mes por jugador</span></div>
          </div>
          <p style="font-family:var(--font-family);font-size:13px;color:var(--fg-2);margin:8px 0 0;line-height:1.5">Sin matrícula ni abonos de temporada. La cuota mensual cubre entrenamientos, participación en campeonatos y equipamiento.</p>
        </div>
        <div style="background:#0E141B;border-radius:6px;padding:18px;color:#fff;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;align-items:center;gap:12px"><i class="fa-solid fa-location-dot" style="width:18px;color:#7FD3F2"></i><span style="font-family:var(--font-family);font-size:14px">{{ store.venue }}</span></div>
          <div v-if="contact.email" style="display:flex;align-items:center;gap:12px"><i class="fa-solid fa-envelope" style="width:18px;color:#7FD3F2"></i><span style="font-family:var(--font-family);font-size:14px">{{ contact.email }}</span></div>
          <div v-if="contact.instagram" style="display:flex;align-items:center;gap:12px"><i class="fa-brands fa-instagram" style="width:18px;color:#7FD3F2"></i><span style="font-family:var(--font-family);font-size:14px">{{ contact.instagram }}</span></div>
          <div v-if="contact.phone" style="display:flex;align-items:center;gap:12px"><i class="fa-solid fa-phone" style="width:18px;color:#7FD3F2"></i><span style="font-family:var(--font-family);font-size:14px">{{ contact.phone }}</span></div>
        </div>
      </div>

      <div style="background:#fff;border:1px solid var(--stroke-1);border-radius:6px;padding:18px">
        <h2 style="font-family:var(--font-family);font-weight:700;font-size:16px;color:var(--fg-1);margin:0 0 14px">Déjanos tus datos</h2>
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="gv-field"><label class="gv-label">Nombre completo</label><input class="gv-input" v-model="form.name" placeholder="Tu nombre y apellido" /></div>
          <div class="gv-field"><label class="gv-label">Correo o teléfono</label><input class="gv-input" v-model="form.contactInfo" placeholder="Para poder responderte" /></div>
          <div class="gv-field"><label class="gv-label">Categoría de interés</label>
            <select class="gv-input" v-model="form.cat">
              <option value="adulto">Adulto — Todo Competidor</option>
              <option value="senior">Senior</option>
              <option value="femenino">Femenino</option>
            </select>
          </div>
          <div class="gv-field"><label class="gv-label">Mensaje</label><textarea class="gv-input" style="height:88px;padding:8px;resize:vertical" v-model="form.msg" placeholder="Cuéntanos tu experiencia previa (opcional)"></textarea></div>
          <button @click="submit" class="gv-btn gv-btn--pill gv-btn--primary" style="height:40px;align-self:flex-start;padding:0 20px">Enviar solicitud</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@media (max-width: 860px) { .grid-2 { grid-template-columns: 1fr !important; } }
</style>
