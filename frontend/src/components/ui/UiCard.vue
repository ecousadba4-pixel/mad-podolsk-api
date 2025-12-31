<script setup lang="ts">
/**
 * UiCard — базовый компонент карточки
 *
 * Варианты:
 * - default: обычная карточка
 * - elevated: с усиленной тенью
 * - flat: без тени
 * - interactive: кликабельная с hover-эффектом
 */
import { computed, type PropType } from 'vue'

type CardVariant = 'default' | 'elevated' | 'flat' | 'interactive'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const props = defineProps({
  variant: {
    type: String as PropType<CardVariant>,
    default: 'default'
  },
  padding: {
    type: String as PropType<CardPadding>,
    default: 'md'
  },
  /** Использовать увеличенный border-radius */
  rounded: {
    type: Boolean,
    default: false
  },
  /** HTML-тег для карточки */
  tag: {
    type: String as PropType<keyof HTMLElementTagNameMap>,
    default: 'div'
  }
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const classes = computed(() => [
  'ui-card',
  `ui-card--${props.variant}`,
  `ui-card--padding-${props.padding}`,
  { 'ui-card--rounded': props.rounded }
])

function handleClick(e: MouseEvent) {
  if (props.variant === 'interactive') {
    emit('click', e)
  }
}
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :role="variant === 'interactive' ? 'button' : undefined"
    :tabindex="variant === 'interactive' ? 0 : undefined"
    @click="handleClick"
    @keydown.enter="variant === 'interactive' && handleClick($event as unknown as MouseEvent)"
    @keydown.space.prevent="variant === 'interactive' && handleClick($event as unknown as MouseEvent)"
  >
    <slot name="header" />
    <slot />
    <slot name="footer" />
  </component>
</template>

<style scoped lang="scss">
.ui-card {
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  color: var(--text-main);

  /* Padding variants */
  &--padding-none { padding: 0; }
  &--padding-sm { padding: var(--gap-sm); }
  &--padding-md { padding: var(--card-padding); }
  &--padding-lg { padding: var(--card-inner-indent); }

  /* Variants */
  &--default {
    box-shadow: var(--shadow-card);
  }

  &--elevated {
    box-shadow: var(--shadow-strong);
  }

  &--flat {
    box-shadow: none;
  }

  &--interactive {
    cursor: pointer;
    transition: var(--transition-lift), var(--transition-border);
    box-shadow: var(--shadow-card);

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-strong);
      border-color: var(--border-strong);
    }

    &:active {
      transform: translateY(0);
      box-shadow: var(--shadow-soft);
    }

    &:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  }

  /* Rounded modifier */
  &--rounded {
    border-radius: var(--radius-xl);
  }
}
</style>
