<script setup lang="ts">
/**
 * UiSkeleton — компонент-заглушка для состояния загрузки
 *
 * Типы:
 * - line: текстовая строка
 * - circle: круглый элемент (аватар, иконка)
 * - rect: прямоугольный блок
 * - card: карточка с несколькими строками
 */
import { computed, type PropType } from 'vue'

type SkeletonType = 'line' | 'circle' | 'rect' | 'card'

const props = defineProps({
  type: {
    type: String as PropType<SkeletonType>,
    default: 'line'
  },
  /** Ширина (для line/rect) */
  width: {
    type: String,
    default: '100%'
  },
  /** Высота (для line/rect) */
  height: {
    type: String,
    default: undefined
  },
  /** Размер (для circle) */
  size: {
    type: String,
    default: '40px'
  },
  /** Количество строк (для card) */
  lines: {
    type: Number,
    default: 3
  },
  /** Отключить анимацию */
  static: {
    type: Boolean,
    default: false
  }
})

const lineHeight = computed(() => {
  if (props.height) return props.height
  return props.type === 'card' ? '12px' : '16px'
})

const classes = computed(() => [
  'ui-skeleton',
  `ui-skeleton--${props.type}`,
  { 'ui-skeleton--static': props.static }
])
</script>

<template>
  <div v-if="type === 'card'" :class="classes">
    <div
      v-for="i in lines"
      :key="i"
      class="ui-skeleton__line"
      :style="{
        width: i === lines ? '60%' : '100%',
        height: lineHeight
      }"
    />
  </div>

  <div
    v-else-if="type === 'circle'"
    :class="classes"
    :style="{ width: size, height: size }"
  />

  <div
    v-else
    :class="classes"
    :style="{ width, height: lineHeight }"
  />
</template>

<style scoped lang="scss">
.ui-skeleton {
  background: var(--gradient-skeleton);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: var(--radius-sm);

  &--static {
    animation: none;
    background: var(--bg-muted);
  }

  &--line {
    height: 16px;
  }

  &--circle {
    border-radius: var(--radius-xxl);
  }

  &--rect {
    border-radius: var(--radius-md);
  }

  &--card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: var(--card-padding);
    background: var(--bg-card);
    border: 1px solid var(--border-skeleton);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-card);
  }

  &__line {
    background: var(--gradient-skeleton);
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite;
    border-radius: var(--radius-sm);
  }
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .ui-skeleton,
  .ui-skeleton__line {
    animation: none;
  }
}
</style>
