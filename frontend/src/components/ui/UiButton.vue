<script setup lang="ts">
/**
 * UiButton — базовая кнопка с вариантами оформления
 *
 * Варианты:
 * - primary: основная акцентная кнопка
 * - secondary: второстепенная (обводка)
 * - ghost: прозрачный фон
 * - danger: деструктивное действие
 *
 * Размеры: sm, md, lg
 */
import { computed, type PropType } from 'vue'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = defineProps({
  variant: {
    type: String as PropType<ButtonVariant>,
    default: 'primary'
  },
  size: {
    type: String as PropType<ButtonSize>,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  fullWidth: {
    type: Boolean,
    default: false
  },
  /** Иконочная кнопка (квадратная) */
  icon: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() => [
  'ui-button',
  `ui-button--${props.variant}`,
  `ui-button--${props.size}`,
  {
    'ui-button--disabled': props.disabled || props.loading,
    'ui-button--loading': props.loading,
    'ui-button--full-width': props.fullWidth,
    'ui-button--icon': props.icon
  }
])

function handleClick(e: MouseEvent) {
  if (!props.disabled && !props.loading) {
    emit('click', e)
  }
}
</script>

<template>
  <button
    :class="classes"
    :disabled="disabled || loading"
    type="button"
    @click="handleClick"
  >
    <span v-if="loading" class="ui-button__spinner" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" opacity="0.25" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </span>
    <span class="ui-button__content" :class="{ 'ui-button__content--hidden': loading }">
      <slot />
    </span>
  </button>
</template>

<style scoped lang="scss">
.ui-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-xs);
  font-family: var(--font-sans);
  font-weight: 600;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-lift), var(--transition-border);
  white-space: nowrap;
  position: relative;
  border: 1px solid transparent;

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  /* Sizes */
  &--sm {
    height: var(--control-height-mobile);
    padding: 0 var(--gap-md);
    font-size: var(--font-size-caption);
  }

  &--md {
    height: var(--control-height-sm);
    padding: 0 var(--gap-lg);
    font-size: var(--font-size-body-sm);
  }

  &--lg {
    height: var(--control-height);
    padding: 0 var(--gap-xl);
    font-size: var(--font-size-body);
  }

  /* Icon button */
  &--icon {
    padding: 0;
    aspect-ratio: 1;

    &.ui-button--sm { width: var(--control-height-mobile); }
    &.ui-button--md { width: var(--control-height-sm); }
    &.ui-button--lg { width: var(--control-height); }
  }

  /* Variants */
  &--primary {
    background: var(--accent);
    color: var(--text-inverse);
    box-shadow: var(--shadow-btn-primary);

    &:hover:not(:disabled) {
      background: var(--accent-strong);
      transform: translateY(-1px);
      box-shadow: var(--shadow-btn-airy-hover);
    }

    &:active:not(:disabled) {
      background: var(--accent-strong);
      transform: translateY(0);
      box-shadow: var(--shadow-btn-primary-active);
    }
  }

  &--secondary {
    background: var(--bg-card);
    color: var(--text-main);
    border-color: var(--border-soft);
    box-shadow: var(--shadow-soft);

    &:hover:not(:disabled) {
      background: var(--bg-muted);
      border-color: var(--border-strong);
      transform: translateY(-1px);
      box-shadow: var(--shadow-btn-airy-hover);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: var(--shadow-btn-airy-active);
    }
  }

  &--ghost {
    background: transparent;
    color: var(--text-muted);

    &:hover:not(:disabled) {
      background: var(--overlay-dark-hover);
      color: var(--text-main);
    }

    &:active:not(:disabled) {
      background: var(--overlay-dark);
    }
  }

  &--danger {
    background: var(--danger);
    color: var(--text-inverse);
    box-shadow: 0 4px 12px rgb(192 52 43 / 25%);

    &:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgb(192 52 43 / 30%);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
      filter: brightness(0.95);
    }
  }

  /* States */
  &--disabled,
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  &--full-width {
    width: 100%;
  }

  &--loading {
    cursor: wait;
    pointer-events: none;
  }

  &__spinner {
    position: absolute;
    width: 1.2em;
    height: 1.2em;
    animation: spin 0.8s linear infinite;

    svg {
      width: 100%;
      height: 100%;
    }
  }

  &__content {
    display: inline-flex;
    align-items: center;
    gap: var(--gap-xs);

    &--hidden {
      visibility: hidden;
    }
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
