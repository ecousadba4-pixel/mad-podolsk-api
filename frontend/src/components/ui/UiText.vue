<script setup lang="ts">
/**
 * UiText — типографический компонент
 *
 * Использует токены размеров шрифтов из _tokens.scss.
 * Упрощает единообразное применение типографики.
 */
import { computed, type PropType } from 'vue'

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'body-sm' | 'caption' | 'label' | 'tiny'
type TextColor = 'main' | 'subtle' | 'muted' | 'soft' | 'faint' | 'accent' | 'success' | 'danger' | 'inherit'
type TextAlign = 'left' | 'center' | 'right'
type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold'

const props = defineProps({
  variant: {
    type: String as PropType<TextVariant>,
    default: 'body'
  },
  color: {
    type: String as PropType<TextColor>,
    default: 'main'
  },
  weight: {
    type: String as PropType<TextWeight>,
    default: undefined
  },
  align: {
    type: String as PropType<TextAlign>,
    default: undefined
  },
  /** Преобразовать в uppercase */
  uppercase: {
    type: Boolean,
    default: false
  },
  /** Добавить letter-spacing для label-стиля */
  tracking: {
    type: Boolean,
    default: false
  },
  /** Обрезать текст с ellipsis */
  truncate: {
    type: Boolean,
    default: false
  },
  /** Использовать tabular-nums для чисел */
  numeric: {
    type: Boolean,
    default: false
  },
  /** HTML-тег */
  tag: {
    type: String as PropType<keyof HTMLElementTagNameMap>,
    default: 'span'
  }
})

const defaultTag = computed(() => {
  if (props.tag !== 'span') return props.tag
  switch (props.variant) {
    case 'h1': return 'h1'
    case 'h2': return 'h2'
    case 'h3': return 'h3'
    default: return 'span'
  }
})

const classes = computed(() => [
  'ui-text',
  `ui-text--${props.variant}`,
  `ui-text--color-${props.color}`,
  props.weight && `ui-text--weight-${props.weight}`,
  props.align && `ui-text--align-${props.align}`,
  {
    'ui-text--uppercase': props.uppercase,
    'ui-text--tracking': props.tracking,
    'ui-text--truncate': props.truncate,
    'ui-text--numeric': props.numeric
  }
])
</script>

<template>
  <component :is="defaultTag" :class="classes">
    <slot />
  </component>
</template>

<style scoped lang="scss">
.ui-text {
  margin: 0;
  font-family: var(--font-sans);

  /* Variants (size) */
  &--h1 { font-size: var(--font-size-h1); font-weight: 700; line-height: 1.2; }
  &--h2 { font-size: var(--font-size-h2); font-weight: 700; line-height: 1.3; }
  &--h3 { font-size: var(--font-size-h3); font-weight: 600; line-height: 1.4; }
  &--body { font-size: var(--font-size-body); line-height: 1.5; }
  &--body-sm { font-size: var(--font-size-body-sm); line-height: 1.5; }
  &--caption { font-size: var(--font-size-caption); line-height: 1.4; }
  &--label { font-size: var(--font-size-label); line-height: 1.3; }
  &--tiny { font-size: var(--font-size-tiny); line-height: 1.3; }

  /* Colors */
  &--color-main { color: var(--text-main); }
  &--color-subtle { color: var(--text-subtle); }
  &--color-muted { color: var(--text-muted); }
  &--color-soft { color: var(--text-soft); }
  &--color-faint { color: var(--text-faint); }
  &--color-accent { color: var(--accent); }
  &--color-success { color: var(--success); }
  &--color-danger { color: var(--danger); }
  &--color-inherit { color: inherit; }

  /* Weights */
  &--weight-normal { font-weight: 400; }
  &--weight-medium { font-weight: 500; }
  &--weight-semibold { font-weight: 600; }
  &--weight-bold { font-weight: 700; }

  /* Alignment */
  &--align-left { text-align: left; }
  &--align-center { text-align: center; }
  &--align-right { text-align: right; }

  /* Modifiers */
  &--uppercase { text-transform: uppercase; }
  &--tracking { letter-spacing: 0.06em; }
  &--truncate {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &--numeric {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
  }
}
</style>
