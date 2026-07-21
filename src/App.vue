<script setup>
import { onMounted } from 'vue'
import { useClubStore } from '@/stores/club'
import Toast from '@/components/Toast.vue'

const store = useClubStore()

onMounted(() => {
  if (!store.loaded) store.load()
})
</script>

<template>
  <router-view v-if="store.loaded" />
  <div v-else class="cdsp-loading">
    <img src="/assets/logo.png" alt="Club Project" />
  </div>
  <Toast />
</template>

<style scoped>
.cdsp-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-1);
}
.cdsp-loading img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  animation: cdspGlow 1.6s ease-in-out infinite;
}
</style>
