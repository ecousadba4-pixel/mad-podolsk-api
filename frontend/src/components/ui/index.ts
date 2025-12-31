/**
 * UI Kit — единая библиотека базовых компонентов
 *
 * Все компоненты используют токены из `src/styles/_tokens.scss`.
 * Экспортируются для переиспользования во всём приложении.
 */

// Base primitives
export { default as UiButton } from './UiButton.vue'
export { default as UiCard } from './UiCard.vue'
export { default as UiProgress } from './UiProgress.vue'
export { default as UiBadge } from './UiBadge.vue'
export { default as UiSkeleton } from './UiSkeleton.vue'
export { default as UiSpinner } from './UiSpinner.vue'

// Form controls
export { default as UiInput } from './UiInput.vue'

// Typography
export { default as UiText } from './UiText.vue'
export { default as UiLabel } from './UiLabel.vue'

// Layout
export { default as UiStack } from './UiStack.vue'

// Icons (re-export from common for convenience)
export {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Close,
  Check
} from '../common/Icons.vue'

// Token utilities
export {
  useCssVar,
  gapTokens,
  radiusTokens,
  fontSizeTokens,
  textColorTokens,
  semanticColorTokens,
  shadowTokens,
  controlHeightTokens
} from './tokens'

export type {
  GapToken,
  RadiusToken,
  FontSizeToken,
  TextColorToken,
  SemanticColorToken,
  ShadowToken,
  ControlHeightToken
} from './tokens'
