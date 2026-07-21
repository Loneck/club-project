<script setup>
import { useClubStore } from '@/stores/club'
const store = useClubStore()
</script>

<template>
  <div v-if="store.toast" class="gv-toast-stack">
    <div class="gv-toast" style="border-color: var(--color-success-icon); background: var(--color-success-surface)">
      <i class="fa-solid fa-circle-check" style="color: var(--color-success-icon); font-size: 18px"></i>
      <span>{{ store.toast }}</span>
      <span class="gv-toast__x" @click="store.closeToast()"><i class="fa-solid fa-xmark"></i></span>
    </div>
  </div>
</template>
