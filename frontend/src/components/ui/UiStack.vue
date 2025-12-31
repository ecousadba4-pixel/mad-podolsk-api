<script setup lang="ts">
/**
 * UiStack — компонент-контейнер для вертикальной/горизонтальной укладки
 *
 * Упрощает создание flex-контейнеров с единообразными отступами.
 * Использует токены gap из _tokens.scss.
 */
import { computed, type PropType } from 'vue'

type StackDirection = 'row' | 'column'
type StackGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline'
type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly'

const props = defineProps({
  direction: {
    type: String as PropType<StackDirection>,
    default: 'column'
  },
  gap: {
    type: String as PropType<StackGap>,
    default: 'sm'
  },
  align: {
    type: String as PropType<StackAlign>,
    default: undefined
  },
  justify: {
    type: String as PropType<StackJustify>,
    default: undefined
  },
  /** Разрешить перенос (flex-wrap) */
  wrap: {
    type: Boolean,
    default: false
  },
  /** Занять всю ширину */
  fullWidth: {
    type: Boolean,
    default: false
  },
  /** HTML-тег */
  tag: {
    type: String as PropType<keyof HTMLElementTagNameMap>,
    default: 'div'
  }
})

const gapVar = computed(() => {
  const gaps: Record<StackGap, string> = {
    none: '0',
    xs: 'var(--gap-xs)',
    sm: 'var(--gap-sm)',
    md: 'var(--gap-md)',
    lg: 'var(--gap-lg)',
    xl: 'var(--gap-xl)'
  }
  return gaps[props.gap]
})

const alignMap: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline'
}

const justifyMap: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly'
}

const styles = computed(() => ({
  display: 'flex',
  flexDirection: props.direction,
  gap: gapVar.value,
  alignItems: props.align ? alignMap[props.align] : undefined,
  justifyContent: props.justify ? justifyMap[props.justify] : undefined,
  flexWrap: props.wrap ? 'wrap' : undefined,
  width: props.fullWidth ? '100%' : undefined
}))
</script>

<template>
  <component :is="tag" class="ui-stack" :style="styles">
    <slot />
  </component>
</template>

<style scoped lang="scss">
.ui-stack {
  min-width: 0; /* Prevent flex item overflow */
}
</style>
