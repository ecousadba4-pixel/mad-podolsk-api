<script setup lang="ts">
/**
 * UiSpinner — индикатор загрузки
 *
 * Размеры: sm, md, lg
 */
import { computed, type PropType } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'

const props = defineProps({
  size: {
    type: String as PropType<SpinnerSize>,
    default: 'md'
  },
  /** Использовать цвет текущего контекста */
  inherit: {
    type: Boolean,
    default: false
  }
})

const sizeMap: Record<SpinnerSize, string> = {
  sm: '16px',
  md: '24px',
  lg: '40px'
}

const spinnerSize = computed(() => sizeMap[props.size])
</script>

<template>
  <svg
    class="ui-spinner"
    :class="{ 'ui-spinner--inherit': inherit }"
    :width="spinnerSize"
    :height="spinnerSize"
    viewBox="0 0 24 24"
    fill="none"
    aria-label="Загрузка..."
    role="status"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      stroke-width="2"
      opacity="0.25"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped lang="scss">
.ui-spinner {
  animation: spin 0.8s linear infinite;
  color: var(--accent);

  &--inherit {
    color: inherit;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .ui-spinner {
    animation-duration: 1.5s;
  }
}
</style>
