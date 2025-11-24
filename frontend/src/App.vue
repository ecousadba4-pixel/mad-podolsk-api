<script setup>
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div id="app-layout">
    <!-- общий хедер с заголовком и переключателем режимов -->
    <AppHeader />

    <!-- зона контента роутера (По месяцам / По дням) -->
    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<style>
#app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f7f7;
}

/* отступы для основного содержимого */
.app-content {
  padding: 24px;
  flex-grow: 1;
}
</style>
