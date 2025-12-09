<script setup>
/**
 * ExportPdfButton - кнопка для скачивания PDF отчёта
 * 
 * Особенности:
 * - Доступна только в режиме "По месяцам"
 * - В режиме "По дням" отключена и имеет приглушённый вид
 * - Скрыта на мобильных устройствах
 * - Отображает иконку скачивания + текст "PDF"
 */
import { ref, computed } from 'vue'
import { downloadMonthlyPdf } from '../../api/dashboard.js'

const props = defineProps({
  /** Текущий выбранный месяц в формате YYYY-MM */
  month: {
    type: String,
    required: true
  },
  /** Активен ли режим "По месяцам" */
  isMonthlyMode: {
    type: Boolean,
    default: true
  }
})

const isLoading = ref(false)
const error = ref(null)

const isDisabled = computed(() => !props.isMonthlyMode || isLoading.value)

async function handleClick() {
  if (isDisabled.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    await downloadMonthlyPdf(props.month)
  } catch (err) {
    console.error('PDF download failed:', err)
    error.value = err.message || 'Ошибка загрузки PDF'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <button
    type="button"
    class="export-pdf-btn"
    :class="{ 
      'export-pdf-btn--disabled': isDisabled,
      'export-pdf-btn--loading': isLoading 
    }"
    :disabled="isDisabled"
    :title="isDisabled ? 'PDF-отчёт доступен только в режиме «По месяцам»' : 'Скачать отчёт в PDF'"
    @click="handleClick"
  >
    <!-- Download icon -->
    <svg 
      class="export-pdf-btn__icon" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width="2" 
      stroke-linecap="round" 
      stroke-linejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
    <span class="export-pdf-btn__text">PDF</span>
    
    <!-- Loading spinner -->
    <svg 
      v-if="isLoading"
      class="export-pdf-btn__spinner" 
      viewBox="0 0 24 24"
    >
      <circle 
        class="spinner-circle" 
        cx="12" 
        cy="12" 
        r="10" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      />
    </svg>
  </button>
</template>

<style scoped>
.export-pdf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--gap-xs, 6px);
  
  /* Match control height from header */
  height: var(--control-height, 40px);
  padding: 0 var(--card-inner-gap, 12px);
  
  /* Visual style */
  background: var(--bg-card, #fff);
  border: 1px solid var(--border-soft, #e2e8f0);
  border-radius: 10px;
  box-shadow: var(--shadow-soft, 0 1px 3px rgba(0,0,0,0.08));
  
  /* Typography */
  font-family: var(--font-sans, 'Manrope', sans-serif);
  font-size: var(--font-size-body-sm, 14px);
  font-weight: 600;
  color: var(--text-main, #1a1a2e);
  
  /* Interaction */
  cursor: pointer;
  transition: 
    background-color 0.18s ease, 
    color 0.18s ease, 
    border-color 0.18s ease,
    opacity 0.18s ease,
    transform 0.12s ease;
}

.export-pdf-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f1f5f9);
  border-color: var(--border-default, #cbd5e1);
}

.export-pdf-btn:active:not(:disabled) {
  transform: scale(0.97);
}

/* Disabled state */
.export-pdf-btn--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

/* Loading state */
.export-pdf-btn--loading {
  pointer-events: none;
}

.export-pdf-btn--loading .export-pdf-btn__icon {
  opacity: 0;
}

/* Icon */
.export-pdf-btn__icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* Text */
.export-pdf-btn__text {
  line-height: 1;
}

/* Loading spinner */
.export-pdf-btn__spinner {
  position: absolute;
  width: 18px;
  height: 18px;
  animation: spin 1s linear infinite;
}

.spinner-circle {
  stroke-dasharray: 50;
  stroke-dashoffset: 20;
  stroke-linecap: round;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Hide on mobile - handled via CSS media query */
@media (max-width: 768px) {
  .export-pdf-btn {
    display: none;
  }
}
</style>
