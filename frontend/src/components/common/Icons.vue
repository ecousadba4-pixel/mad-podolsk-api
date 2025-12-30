<script setup lang="ts">
/**
 * SVG Icon components for reuse across the app.
 * Using functional components for performance.
 */
</script>

<script lang="ts">
import { defineComponent, h, type FunctionalComponent } from 'vue'

interface IconProps {
  size?: number | string
}

// Helper to create icon component
function createIcon(pathD: string, name: string): FunctionalComponent<IconProps> {
  const component: FunctionalComponent<IconProps> = (props) => {
    const size = props.size ?? 20
    return h('svg', {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      'aria-hidden': 'true'
    }, [
      h('path', {
        d: pathD,
        stroke: 'currentColor',
        'stroke-width': '2',
        'stroke-linecap': 'round',
        'stroke-linejoin': 'round'
      })
    ])
  }
  component.displayName = name
  return component
}

// Chevron icons
export const ChevronLeft = createIcon('M15 18l-6-6 6-6', 'ChevronLeft')
export const ChevronRight = createIcon('M9 18l6-6-6-6', 'ChevronRight')
export const ChevronDown = createIcon('M7 10l5 5 5-5', 'ChevronDown')
export const ChevronUp = createIcon('M7 14l5-5 5 5', 'ChevronUp')

// Common icons
export const Calendar = createIcon(
  'M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z',
  'Calendar'
)
export const Close = createIcon('M18 6L6 18M6 6l12 12', 'Close')
export const Check = createIcon('M5 13l4 4L19 7', 'Check')

// Export default component that re-exports all icons
export default defineComponent({
  name: 'Icons',
  components: {
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    Calendar,
    Close,
    Check
  }
})
</script>
