<template>
  <section class="page-section" :class="[variantClass]">
    <header v-if="title || $slots.header" class="page-section__header">
      <slot name="header">
        <div class="panel-title-group">
          <h3 class="panel-title text-h3">{{ title }}</h3>
          <p v-if="subtitle" class="page-section__subtitle">{{ subtitle }}</p>
        </div>
      </slot>
      <div v-if="$slots.actions" class="page-section__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="page-section__body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Заголовок секции */
  title?: string
  /** Подзаголовок */
  subtitle?: string
  /** Вариант отображения */
  variant?: 'default' | 'panel' | 'flat'
}>()

defineSlots<{
  default(): unknown
  header(): unknown
  actions(): unknown
}>()

const variantClass = computed(() => `page-section--${props.variant ?? 'panel'}`)
</script>

<style scoped>
.page-section {
  width: 100%;
  box-sizing: border-box;
}

/* Панель со стилем карточки */
.page-section--panel {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-soft);
  border-radius: var(--radius-lg);
  padding: var(--card-padding);
}

/* Плоский вариант без фона */
.page-section--flat {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
}

/* Минимальный вариант */
.page-section--default {
  background: transparent;
  padding: var(--gap-md) 0;
}

.page-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--gap-md);
  margin-bottom: var(--card-inner-gap);
}

.page-section__subtitle {
  margin: 0;
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.page-section__actions {
  display: flex;
  gap: var(--gap-sm);
  align-items: center;
}

.page-section__body {
  width: 100%;
}
</style>
