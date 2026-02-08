<template>
  <Teleport to="body" v-if="visible">
    <div class="modal-backdrop visible" @click.self="$emit('close')">
      <div class="modal modal-chart p-md" :class="{ 'is-mobile': isMobile }" role="dialog" aria-modal="true">
        <header class="modal-header items-center row-between">
          <h3 class="modal-title text-h2">Выручка по дням — {{ monthTitle }}</h3>
          <button class="modal-close control-sm" @click="$emit('close')">✕</button>
        </header>

        <div class="modal-body">
          <div v-if="loading" class="chart-loading">Загрузка…</div>
          <div v-else-if="error" class="dashboard__state dashboard__state--error">Ошибка: {{ error }}</div>
          <div v-else-if="rowsList.length === 0" class="chart-empty">Нет данных за выбранный месяц</div>
          <div v-else class="chart-container">
            <svg 
              class="revenue-chart" 
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <!-- Grid lines -->
              <g class="chart-grid">
                <line 
                  v-for="(tick, i) in yTicks" 
                  :key="'grid-' + i"
                  :x1="padding.left"
                  :x2="chartWidth - padding.right"
                  :y1="tick.y"
                  :y2="tick.y"
                  class="grid-line"
                />
              </g>

              <!-- Goal dashed line -->
              <line 
                v-if="goalY !== null"
                :x1="padding.left"
                :x2="chartWidth - padding.right"
                :y1="goalY"
                :y2="goalY"
                class="goal-line"
              />
              <text 
                v-if="goalY !== null"
                :x="chartWidth - padding.right - 35"
                :y="goalY - 6"
                class="goal-label"
              >Цель</text>

              <!-- Area fill under the curve -->
              <path 
                :d="areaPath" 
                class="chart-area"
              />

              <!-- Smooth curve line -->
              <path 
                :d="linePath" 
                class="chart-line"
              />

              <!-- Data points -->
              <g class="chart-points">
                <circle 
                  v-for="(point, i) in chartPoints" 
                  :key="'point-' + i"
                  :cx="point.x"
                  :cy="point.y"
                  r="5"
                  class="chart-point"
                  @mouseenter="handlePointHover(point, $event)"
                  @mouseleave="hoveredPoint = null"
                />
              </g>

              <!-- Y axis labels -->
              <g class="y-axis">
                <text 
                  v-for="(tick, i) in yTicks" 
                  :key="'y-' + i"
                  :x="padding.left - 10"
                  :y="tick.y + 4"
                  class="axis-label y-label"
                >{{ tick.label }}</text>
              </g>

              <!-- X axis labels -->
              <g class="x-axis">
                <text 
                  v-for="(label, i) in xLabels" 
                  :key="'x-' + i"
                  :x="label.x"
                  :y="chartHeight - padding.bottom + 20"
                  class="axis-label x-label"
                >{{ label.text }}</text>
              </g>

              <!-- Y axis title (desktop only) -->
              <text 
                v-if="!isMobile"
                :x="14"
                :y="chartHeight / 2"
                class="axis-title"
                transform-origin="14 50%"
                :transform="`rotate(-90, 14, ${chartHeight / 2})`"
              >Стоимость</text>

              <!-- X axis title (desktop only) -->
              <text 
                v-if="!isMobile"
                :x="chartWidth / 2"
                :y="chartHeight - 5"
                class="axis-title"
              >Дата</text>
            </svg>

            <!-- Tooltip -->
            <div 
              v-if="hoveredPoint" 
              class="chart-tooltip"
              :style="tooltipStyle"
            >
              <div class="tooltip-date">{{ hoveredPoint.dateFormatted }}</div>
              <div class="tooltip-value">{{ formatMoney(hoveredPoint.amount) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useIsMobile } from '../../composables/useIsMobile'
import { useQuery } from '../../composables/useQueryClient'
import { formatMoney } from '../../utils/format'

// Цель выручки (ручное значение)
const DAILY_REVENUE_GOAL = 650_000

interface Props {
  visible: boolean
  month: string
}

interface DailyRevenueRow {
  date: string
  amount: number
}

interface ChartPoint {
  x: number
  y: number
  date: string
  dateFormatted: string
  amount: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

const { isMobile } = useIsMobile()

// Chart dimensions - optimized for mobile
const chartWidth = computed(() => isMobile.value ? 500 : 800)
const chartHeight = computed(() => isMobile.value ? 280 : 350)
const padding = computed(() => isMobile.value 
  ? { top: 25, right: 10, bottom: 35, left: 55 }  // Compact for mobile
  : { top: 30, right: 70, bottom: 50, left: 80 }  // Spacious for desktop
)

// Hover state
const hoveredPoint = ref<ChartPoint | null>(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// Data fetching
const dailyRevenueQuery = useQuery({
  queryKey: () => ['monthly-daily-revenue-chart', props.month],
  queryFn: async () => {
    if (!props.month) return []
    const api = await import('../../api/dashboard')
    const res = await api.getMonthlyDailyRevenue(props.month)
    return res.rows || []
  },
  enabled: computed(() => Boolean(props.visible && props.month)),
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false
})

const rowsList = computed<DailyRevenueRow[]>(() => dailyRevenueQuery.data.value || [])
const loading = computed(() => dailyRevenueQuery.isLoading.value || dailyRevenueQuery.isFetching.value)
const error = computed(() => dailyRevenueQuery.error.value ? (dailyRevenueQuery.error.value.message || 'Ошибка загрузки') : null)

// Format month for title (e.g., "2026-01" -> "Январь 2026")
const monthTitle = computed(() => {
  if (!props.month) return ''
  const [year, month] = props.month.split('-')
  const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 
                      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']
  const monthIndex = parseInt(month ?? '1', 10) - 1
  return `${monthNames[monthIndex]} ${year}`
})

// Calculate chart bounds with nice round numbers
// Dynamically calculate tick step to have 5-8 ticks
const tickStep = computed(() => {
  const dataMax = Math.max(...rowsList.value.map(r => r.amount), 0)
  const rawMax = Math.max(dataMax, DAILY_REVENUE_GOAL) * 1.1
  
  // Find appropriate step: 50k, 100k, 200k, 500k, 1M etc
  const possibleSteps = [50_000, 100_000, 200_000, 500_000, 1_000_000]
  
  for (const step of possibleSteps) {
    const ticks = Math.ceil(rawMax / step)
    if (ticks <= 8) return step
  }
  return 500_000
})

const maxValue = computed(() => {
  const dataMax = Math.max(...rowsList.value.map(r => r.amount), 0)
  const rawMax = Math.max(dataMax, DAILY_REVENUE_GOAL) * 1.1 // 10% padding above max
  // Round up to nearest multiple of tickStep
  return Math.ceil(rawMax / tickStep.value) * tickStep.value
})

const minValue = computed(() => 0)

// Calculate chart points
const chartPoints = computed<ChartPoint[]>(() => {
  if (rowsList.value.length === 0) return []
  
  const p = padding.value
  const plotWidth = chartWidth.value - p.left - p.right
  const plotHeight = chartHeight.value - p.top - p.bottom
  const range = maxValue.value - minValue.value || 1
  
  return rowsList.value.map((row, i) => {
    const x = p.left + (i / Math.max(rowsList.value.length - 1, 1)) * plotWidth
    const y = p.top + plotHeight - ((row.amount - minValue.value) / range) * plotHeight
    
    return {
      x,
      y,
      date: row.date,
      dateFormatted: formatDate(row.date),
      amount: row.amount
    }
  })
})

// Goal line Y position
const goalY = computed(() => {
  if (rowsList.value.length === 0) return null
  const p = padding.value
  const plotHeight = chartHeight.value - p.top - p.bottom
  const range = maxValue.value - minValue.value || 1
  return p.top + plotHeight - ((DAILY_REVENUE_GOAL - minValue.value) / range) * plotHeight
})

// Generate smooth curve path using Catmull-Rom spline
const linePath = computed(() => {
  if (chartPoints.value.length < 2) return ''
  return generateSmoothPath(chartPoints.value, false)
})

// Area path (filled region under curve)
const areaPath = computed(() => {
  if (chartPoints.value.length < 2) return ''
  return generateSmoothPath(chartPoints.value, true)
})

// Y axis ticks - use dynamic tick step for cleaner display
const yTicks = computed(() => {
  const range = maxValue.value - minValue.value
  const step = tickStep.value
  const tickCount = Math.round(range / step)
  const p = padding.value
  const plotHeight = chartHeight.value - p.top - p.bottom
  
  const ticks = []
  for (let i = 0; i <= tickCount; i++) {
    const value = minValue.value + step * i
    const y = p.top + plotHeight - (value / range) * plotHeight
    ticks.push({
      value,
      y,
      label: formatAxisValue(value)
    })
  }
  return ticks
})

// X axis labels - show day numbers with smart spacing
const xLabels = computed(() => {
  if (chartPoints.value.length === 0) return []
  
  const points = chartPoints.value
  const totalDays = points.length
  const p = padding.value
  
  // Calculate optimal step to show ~7-10 labels without overlap
  // Each label needs ~50px minimum space
  const plotWidth = chartWidth.value - p.left - p.right
  const maxLabels = Math.floor(plotWidth / 55)
  const step = Math.max(1, Math.ceil(totalDays / maxLabels))
  
  const labels: Array<{ x: number; text: string }> = []
  const firstPoint = points[0]
  
  // Always start with first day
  if (firstPoint) {
    labels.push({
      x: firstPoint.x,
      text: formatDayOnly(firstPoint.date)
    })
  }
  
  // Add intermediate labels
  for (let i = step; i < totalDays - 1; i += step) {
    const point = points[i]
    if (point) {
      labels.push({
        x: point.x,
        text: formatDayOnly(point.date)
      })
    }
  }
  
  // Always end with last day (if not too close to previous)
  const lastPoint = points[totalDays - 1]
  const lastLabel = labels[labels.length - 1]
  if (lastPoint && lastLabel && Math.abs(lastLabel.x - lastPoint.x) > 35) {
    labels.push({
      x: lastPoint.x,
      text: formatDayOnly(lastPoint.date)
    })
  }
  
  return labels
})

// Tooltip positioning
const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.value.x}px`,
  top: `${tooltipPosition.value.y}px`
}))

// Generate smooth Bézier curve path
function generateSmoothPath(points: ChartPoint[], closed: boolean): string {
  if (points.length < 2) return ''
  
  const firstPoint = points[0]
  if (!firstPoint) return ''
  
  const tension = 0.3 // Controls curve smoothness (0 = straight lines, 1 = very curvy)
  let path = `M ${firstPoint.x} ${firstPoint.y}`
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    
    // Calculate control points using Catmull-Rom to Bézier conversion
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  
  if (closed) {
    // Close the area path by going down to baseline and back
    const plotBottom = chartHeight.value - padding.value.bottom
    const lastPoint = points[points.length - 1]
    if (lastPoint && firstPoint) {
      path += ` L ${lastPoint.x} ${plotBottom} L ${firstPoint.x} ${plotBottom} Z`
    }
  }
  
  return path
}

// Format helpers
function formatDate(d: string): string {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  const parts = s.split('-')
  if (parts.length !== 3) return s
  return `${parts[2]}.${parts[1]}.${parts[0]}`
}

// Format as just day number for X axis
function formatDayOnly(d: string): string {
  if (!d) return '-'
  const s = String(d).slice(0, 10)
  const day = s.split('-')[2] ?? ''
  return String(parseInt(day, 10) || 0)
}

function formatAxisValue(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.0', '')} M`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} 000`
  }
  return String(Math.round(value))
}

function handlePointHover(point: ChartPoint, event: MouseEvent) {
  hoveredPoint.value = point
  const rect = (event.target as Element).closest('.chart-container')?.getBoundingClientRect()
  if (rect) {
    const svg = (event.target as Element).closest('svg')
    if (svg) {
      const svgRect = svg.getBoundingClientRect()
      const scaleX = svgRect.width / chartWidth.value
      const scaleY = svgRect.height / chartHeight.value
      tooltipPosition.value = {
        x: point.x * scaleX + 15,
        y: point.y * scaleY - 40
      }
    }
  }
}

// Refetch on visibility/month change
watch(() => props.visible, v => { if (v) dailyRevenueQuery.refetch() })
watch(() => props.month, () => { if (props.visible) dailyRevenueQuery.refetch() })
</script>

<style scoped>
.modal-chart {
  min-width: min(95vw, 900px);
}

.chart-container {
  position: relative;
  width: 100%;
  padding: var(--gap-sm);
}

.revenue-chart {
  width: 100%;
  height: auto;
  min-height: 300px;
  max-height: 400px;
}

.chart-loading,
.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-muted);
  font-size: var(--font-size-body);
}

/* Grid lines */
.grid-line {
  stroke: var(--border-soft);
  stroke-width: 1;
  stroke-dasharray: 4 4;
  opacity: 0.5;
}

/* Goal line */
.goal-line {
  stroke: var(--text-muted);
  stroke-width: 1.5;
  stroke-dasharray: 8 6;
}

.goal-label {
  fill: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
}

/* Chart area fill */
.chart-area {
  fill: var(--overlay-accent-soft);
  opacity: 0.6;
}

/* Chart line */
.chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Data points */
.chart-point {
  fill: var(--bg-card);
  stroke: var(--accent);
  stroke-width: 2;
  cursor: pointer;
  transition: r 0.15s ease, fill 0.15s ease;
}

.chart-point:hover {
  r: 7;
  fill: var(--accent);
}

/* Axis labels */
.axis-label {
  fill: var(--text-muted);
  font-size: 11px;
  font-family: var(--font-sans);
}

.y-label {
  text-anchor: end;
}

.x-label {
  text-anchor: middle;
}

.axis-title {
  fill: var(--text-soft);
  font-size: 12px;
  font-weight: 500;
  text-anchor: middle;
  font-family: var(--font-sans);
}

/* Tooltip */
.chart-tooltip {
  position: absolute;
  background: var(--bg-card);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  padding: var(--gap-sm) var(--gap-md);
  box-shadow: var(--shadow-soft);
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;
}

.tooltip-date {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  margin-bottom: 2px;
}

.tooltip-value {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--accent);
}

/* Mobile adjustments */
.modal.is-mobile .chart-container {
  padding: var(--gap-xs);
}

.modal.is-mobile .revenue-chart {
  min-height: 250px;
}

/* Dark theme support via CSS variables */
:root[data-theme='dark'] .chart-area,
.theme-dark .chart-area {
  fill: var(--overlay-accent-soft);
}
</style>
