<script setup lang="ts">
/**
 * SubsectionToggle — слайдер-переключатель между подразделами
 */
import { computed } from 'vue'

const props = defineProps<{
  modelValue: 'summary' | 'data-entry'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'summary' | 'data-entry'): void
}>()

const activeIndex = computed(() => props.modelValue === 'summary' ? 0 : 1)

function selectOption(option: 'summary' | 'data-entry') {
  emit('update:modelValue', option)
}
</script>

<template>
  <div class="subsection-toggle">
    <div class="subsection-toggle__track">
      <div 
        class="subsection-toggle__indicator" 
        :style="{ transform: `translateX(${activeIndex * 100}%)` }"
      />
      <button
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'summary' }"
        @click="selectOption('summary')"
      >
        Сводка
      </button>
      <button
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'data-entry' }"
        @click="selectOption('data-entry')"
      >
        Внесение данных
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subsection-toggle {
  display: inline-flex;
}

.subsection-toggle__track {
  position: relative;
  display: flex;
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.subsection-toggle__indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(50% - 4px);
  height: calc(100% - 8px);
  background: var(--accent);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgb(47 111 237 / 35%);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.subsection-toggle__option {
  position: relative;
  z-index: 1;
  padding: var(--gap-sm) var(--gap-lg);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  color: var(--text-muted);
  transition: color 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--text-main);
  }

  &--active {
    color: #fff;
    font-weight: 600;
  }
}
</style>
