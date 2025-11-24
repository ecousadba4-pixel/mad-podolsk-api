<script setup>
import AppHeader from './components/AppHeader.vue'
import { useDashboardStore } from './store/dashboardStore.js'

const store = useDashboardStore()
</script>

<template>
  <div class="page" :data-view-mode="store.mode">
    <AppHeader />

    <main class="app-content page__content">
      <RouterView />
    </main>
  </div>
</template>

<!-- styles moved to `src/styles/layout.css` -->
