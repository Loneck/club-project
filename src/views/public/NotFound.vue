<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="cdsp-up" style="max-width:640px;margin:0 auto;padding:80px 24px;text-align:center">
    <img src="/assets/logo.png" alt="Club Project" style="width:96px;height:96px;object-fit:contain;opacity:.9" />
    <div style="font-family:var(--font-family);font-weight:800;font-size:64px;color:var(--fg-1);letter-spacing:-.02em;margin-top:16px">404</div>
    <h1 style="font-family:var(--font-family);font-weight:700;font-size:22px;color:var(--fg-1);margin:8px 0 6px">Página no encontrada</h1>
    <p style="font-family:var(--font-family);font-size:15px;color:var(--fg-2);margin:0 0 24px">La página que buscas no existe o fue movida.</p>
    <button class="gv-btn gv-btn--pill gv-btn--primary" style="height:42px;padding:0 22px" @click="router.push({ name: 'home' })">Volver al inicio</button>
  </div>
</template>
