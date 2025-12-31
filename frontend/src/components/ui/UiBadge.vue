<script setup lang="ts">
/**
 * UiBadge — бейдж / пилюля для статусов и меток
 *
 * Варианты:
 * - default: нейтральный
 * - accent: акцентный (синий)
 * - success: успех (зелёный)
 * - danger: ошибка/предупреждение
 * - muted: приглушённый
 */
import { computed, type PropType } from 'vue'

type BadgeVariant = 'default' | 'accent' | 'success' | 'danger' | 'muted'
type BadgeSize = 'sm' | 'md'

const props = defineProps({
  variant: {
    type: String as PropType<BadgeVariant>,
    default: 'default'
  },
  size: {
    type: String as PropType<BadgeSize>,
    default: 'md'
  },
  /** Показать точку-индикатор */
  dot: {
    type: Boolean,
    default: false
  },
  /** Округлённая форма (pill) */
  rounded: {
    type: Boolean,
    default: false
  }
})

const classes = computed(() => [
  'ui-badge',
  `ui-badge--${props.variant}`,
  `ui-badge--${props.size}`,
  { 'ui-badge--rounded': props.rounded }
])
</script>

<template>
  <span :class="classes">
    <span v-if="dot" class="ui-badge__dot" />
    <slot />
  </span>
</template>

<style scoped lang="scss">
.ui-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--gap-xs);
  font-weight: 600;
  border-radius: var(--radius-sm);
  white-space: nowrap;

  /* Sizes */
  &--sm {
    padding: 2px 6px;
    font-size: var(--font-size-tiny);
  }

  &--md {
    padding: 4px 10px;
    font-size: var(--font-size-caption);
  }

  /* Rounded modifier */
  &--rounded {
    border-radius: var(--radius-xxl);
  }

  /* Variants */
  &--default {
    background: var(--overlay-dark);
    color: var(--text-main);
  }

  &--accent {
    background: var(--overlay-accent-light);
    color: var(--accent);
  }

  &--success {
    background: var(--overlay-success-soft);
    color: var(--success);
  }

  &--danger {
    background: color-mix(in srgb, var(--danger) 15%, transparent);
    color: var(--danger);
  }

  &--muted {
    background: var(--bg-muted);
    color: var(--text-muted);
  }

  /* Dot indicator */
  &__dot {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-xxl);
    flex-shrink: 0;

    .ui-badge--default & { background: var(--text-soft); }
    .ui-badge--accent & { background: var(--accent); }
    .ui-badge--success & { background: var(--success); }
    .ui-badge--danger & { background: var(--danger); }
    .ui-badge--muted & { background: var(--text-faint); }
  }
}

/* Fallback for color-mix */
@supports not (color-mix(in srgb, red, blue)) {
  .ui-badge--danger {
    background: rgb(192 52 43 / 15%);
  }
}
</style>
