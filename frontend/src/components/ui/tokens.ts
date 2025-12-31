/**
 * Composable утилиты для работы с дизайн-токенами
 *
 * Предоставляет программный доступ к значениям CSS-токенов.
 */
import { computed, ref, onMounted, onUnmounted } from 'vue'

/**
 * Получить значение CSS custom property
 */
export function useCssVar(varName: string, defaultValue = '') {
  const value = ref(defaultValue)

  const update = () => {
    const root = document.documentElement
    const computedValue = getComputedStyle(root).getPropertyValue(varName).trim()
    value.value = computedValue || defaultValue
  }

  onMounted(() => {
    update()
    // Обновляем при смене темы
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class']
    })
    onUnmounted(() => observer.disconnect())
  })

  return computed(() => value.value)
}

/**
 * Токены отступов (gap)
 */
export const gapTokens = {
  xs: 'var(--gap-xs)',
  sm: 'var(--gap-sm)',
  md: 'var(--gap-md)',
  lg: 'var(--gap-lg)',
  xl: 'var(--gap-xl)'
} as const

/**
 * Токены радиусов
 */
export const radiusTokens = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-xxl)'
} as const

/**
 * Токены размеров шрифтов
 */
export const fontSizeTokens = {
  h1: 'var(--font-size-h1)',
  h2: 'var(--font-size-h2)',
  h3: 'var(--font-size-h3)',
  body: 'var(--font-size-body)',
  'body-sm': 'var(--font-size-body-sm)',
  caption: 'var(--font-size-caption)',
  label: 'var(--font-size-label)',
  tiny: 'var(--font-size-tiny)'
} as const

/**
 * Токены цветов текста
 */
export const textColorTokens = {
  main: 'var(--text-main)',
  inverse: 'var(--text-inverse)',
  subtle: 'var(--text-subtle)',
  muted: 'var(--text-muted)',
  soft: 'var(--text-soft)',
  faint: 'var(--text-faint)'
} as const

/**
 * Семантические цвета
 */
export const semanticColorTokens = {
  accent: 'var(--accent)',
  success: 'var(--success)',
  danger: 'var(--danger)'
} as const

/**
 * Токены теней
 */
export const shadowTokens = {
  card: 'var(--shadow-card)',
  soft: 'var(--shadow-soft)',
  strong: 'var(--shadow-strong)'
} as const

/**
 * Токены высоты контролов
 */
export const controlHeightTokens = {
  sm: 'var(--control-height-mobile)',
  md: 'var(--control-height-sm)',
  lg: 'var(--control-height)'
} as const

export type GapToken = keyof typeof gapTokens
export type RadiusToken = keyof typeof radiusTokens
export type FontSizeToken = keyof typeof fontSizeTokens
export type TextColorToken = keyof typeof textColorTokens
export type SemanticColorToken = keyof typeof semanticColorTokens
export type ShadowToken = keyof typeof shadowTokens
export type ControlHeightToken = keyof typeof controlHeightTokens
