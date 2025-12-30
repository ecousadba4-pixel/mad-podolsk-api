<template>
  <div class="calendar-header">
    <button 
      type="button" 
      class="calendar-nav calendar-nav--prev" 
      :disabled="!canPrev"
      aria-label="Предыдущий месяц"
      @click="$emit('prev')"
    >
      <ChevronLeft :size="20" />
    </button>
    
    <span class="calendar-title">{{ label }}</span>
    
    <button 
      type="button" 
      class="calendar-nav calendar-nav--next" 
      :disabled="!canNext"
      aria-label="Следующий месяц"
      @click="$emit('next')"
    >
      <ChevronRight :size="20" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight } from '../common/Icons.vue'

interface Props {
  label: string
  canPrev?: boolean
  canNext?: boolean
}

withDefaults(defineProps<Props>(), {
  canPrev: true,
  canNext: true
})

defineEmits<{
  prev: []
  next: []
}>()
</script>

<style lang="scss" scoped>
.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--gap-md);
  padding: 0 var(--gap-xs);
}

.calendar-title {
  font-family: var(--font-sans);
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--text-main);
}

.calendar-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  
  &:hover:not(:disabled) {
    background: var(--surface-highlight);
    color: var(--accent);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
}
</style>
