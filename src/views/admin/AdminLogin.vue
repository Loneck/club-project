<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/services/publish'

const emit = defineEmits(['success'])
const router = useRouter()

const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  if (!password.value) return
  loading.value = true
  error.value = ''
  try {
    const ok = await login(password.value)
    if (ok) {
      emit('success')
    } else {
      error.value = 'Contraseña incorrecta.'
    }
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#0E141B,#0A0E13);padding:24px">
    <div style="width:100%;max-width:360px;background:#fff;border-radius:8px;padding:28px;box-shadow:0 24px 60px rgba(0,0,0,.35)">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;margin-bottom:20px">
        <img src="/assets/logo.png" alt="Club Project" style="width:72px;height:72px;object-fit:contain" />
        <div style="font-family:var(--font-family);font-weight:700;font-size:16px;color:var(--fg-1);margin-top:12px">Panel de administración</div>
        <div style="font-family:var(--font-family);font-size:13px;color:var(--fg-3);margin-top:2px">Ingresa la contraseña para continuar</div>
      </div>
      <form @submit.prevent="submit" style="display:flex;flex-direction:column;gap:14px">
        <div class="gv-field">
          <label class="gv-label">Contraseña</label>
          <input class="gv-input" type="password" v-model="password" :class="{ 'is-error': error }" autofocus autocomplete="current-password" />
          <span v-if="error" class="gv-helper-err">{{ error }}</span>
        </div>
        <button type="submit" class="gv-btn gv-btn--pill gv-btn--primary" style="height:42px" :disabled="loading || !password">
          <i v-if="loading" class="fa-solid fa-spinner fa-spin" style="margin-right:6px;font-size:12px"></i>
          {{ loading ? 'Ingresando…' : 'Ingresar' }}
        </button>
        <button type="button" class="gv-btn gv-btn--pill gv-btn--tertiary" style="height:38px" @click="router.push({ name: 'home' })">Volver al sitio</button>
      </form>
    </div>
  </div>
</template>
