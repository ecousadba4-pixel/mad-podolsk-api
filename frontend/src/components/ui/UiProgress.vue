<script setup lang="ts">
/**
 * UiProgress — прогресс-бар с единообразным стилем
 *
 * Использует унифицированную систему прогресс-баров из _cards.scss.
 * Поддерживает цветовые варианты и overflow-состояние (>100%).
 */
import { computed, type PropType } from 'vue'

type ProgressColor = 'accent' | 'success' | 'danger'
type ProgressSize = 'sm' | 'md' | 'lg'

const props = defineProps({
  /** Значение прогресса (0-100+) */
  value: {
    type: Number,
    required: true
  },
  /** Максимальное значение */
  max: {
    type: Number,
    default: 100
  },
  /** Цвет заполнения */
  color: {
    type: String as PropType<ProgressColor>,
    default: 'accent'
  },
  /** Размер (толщина) */
  size: {
    type: String as PropType<ProgressSize>,
    default: 'md'
  },
  /** Показывать текст процента */
  showLabel: {
    type: Boolean,
    default: false
  },
  /** Показывать подписи (слева/справа) */
  labels: {
    type: Object as PropType<{ left?: string; right?: string }>,
    default: null
  },
  /** Анимировать изменение */
  animated: {
    type: Boolean,
    default: true
  }
})

const percent = computed(() => {
  const p = (props.value / props.max) * 100
  return Math.min(p, 100) // Ограничиваем ширину 100%
})

const isOverflow = computed(() => props.value > props.max)

const displayPercent = computed(() => {
  const p = (props.value / props.max) * 100
  return Math.round(p)
})

const colorVar = computed(() => {
  const colors: Record<ProgressColor, string> = {
    accent: 'var(--accent)',
    success: 'var(--success)',
    danger: 'var(--danger)'
  }
  return colors[props.color]
})
</script>

<template>
  <div class="ui-progress" :class="[`ui-progress--${size}`]">
    <div v-if="labels" class="ui-progress__labels">
      <span v-if="labels.left" class="ui-progress__label-left">{{ labels.left }}</span>
      <strong v-if="labels.right" class="ui-progress__label-right">{{ labels.right }}</strong>
    </div>

    <div class="ui-progress__bar" role="progressbar" :aria-valuenow="value" :aria-valuemax="max">
      <div
        class="ui-progress__fill"
        :class="{ 'ui-progress__fill--overflow': isOverflow, 'ui-progress__fill--animated': animated }"
        :style="{ '--progress': `${percent}%`, '--progress-color': colorVar }"
      />
    </div>

    <span v-if="showLabel" class="ui-progress__percent">
      {{ displayPercent }}%
    </span>
  </div>
</template>

<style scoped lang="scss">
.ui-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &--sm .ui-progress__bar { height: 4px; }
  &--md .ui-progress__bar { height: var(--progress-height); }
  &--lg .ui-progress__bar { height: 12px; }

  &__labels {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap-sm);
    font-size: var(--font-size-label);
    color: var(--text-muted);
  }

  &__label-left {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  &__label-right {
    font-size: var(--font-size-body-sm);
    font-weight: 700;
    color: var(--text-main);
    letter-spacing: 0;
  }

  &__bar {
    width: 100%;
    height: var(--progress-height);
    background: var(--overlay-accent-light);
    border-radius: var(--radius-xxl);
    overflow: hidden;
    position: relative;
  }

  &__fill {
    --progress-color: var(--accent);
    width: var(--progress, 0%);
    height: 100%;
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--progress-color) 75%, var(--surface-base)) 0%,
      var(--progress-color) 100%
    );
    box-shadow: 0 6px 12px color-mix(in srgb, var(--progress-color) 30%, transparent);

    &--animated {
      transition: width 0.35s ease;
    }

    &--overflow {
      box-shadow: 0 6px 16px var(--overlay-success-strong);
    }
  }

  &__percent {
    font-size: var(--font-size-caption);
    font-weight: 600;
    color: var(--text-muted);
    text-align: right;
  }
}

/* Fallback for browsers without color-mix */
@supports not (color-mix(in srgb, red, blue)) {
  .ui-progress__fill {
    background: var(--progress-color);
  }
}
</style>
