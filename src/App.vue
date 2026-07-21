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
    <img src="/assets/logo.jpg" alt="Club Project" />
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
  width: 84px;
  height: 84px;
  border-radius: 999px;
  object-fit: cover;
  animation: cdspGlow 1.6s ease-in-out infinite;
}
</style>
