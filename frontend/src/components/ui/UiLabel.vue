<script setup lang="ts">
/**
 * UiLabel — компонент для меток/подписей
 *
 * Стандартный стиль: uppercase, мелкий шрифт, letter-spacing.
 * Часто используется над значениями в карточках и KPI.
 */
import { type PropType } from 'vue'

type LabelColor = 'muted' | 'soft' | 'faint' | 'accent' | 'main'

defineProps({
  /** Цвет текста */
  color: {
    type: String as PropType<LabelColor>,
    default: 'muted'
  },
  /** Использовать как label для формы */
  for: {
    type: String,
    default: undefined
  }
})
</script>

<template>
  <label
    v-if="$props.for"
    class="ui-label"
    :class="`ui-label--${color}`"
    :for="$props.for"
  >
    <slot />
  </label>
  <span v-else class="ui-label" :class="`ui-label--${color}`">
    <slot />
  </span>
</template>

<style scoped lang="scss">
.ui-label {
  display: block;
  font-size: var(--font-size-label);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  line-height: 1.3;

  &--muted { color: var(--text-muted); }
  &--soft { color: var(--text-soft); }
  &--faint { color: var(--text-faint); }
  &--accent { color: var(--accent); }
  &--main { color: var(--text-main); }
}
</style>
