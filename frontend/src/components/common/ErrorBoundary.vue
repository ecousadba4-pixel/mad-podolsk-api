<script setup lang="ts">
import { ref, onErrorCaptured, type PropType } from 'vue'

interface CapturedError {
  error: Error
  info: string
  timestamp: number
}

const props = defineProps({
  /** Показывать fallback UI при ошибке */
  showFallback: {
    type: Boolean,
    default: true
  },
  /** Текст кнопки повтора */
  retryLabel: {
    type: String,
    default: 'Попробовать снова'
  },
  /** Заголовок ошибки */
  errorTitle: {
    type: String,
    default: 'Что-то пошло не так'
  },
  /** Описание ошибки */
  errorDescription: {
    type: String,
    default: 'Произошла ошибка при отображении этого раздела'
  },
  /** Пропускать ошибку дальше (для логирования в родителе) */
  propagate: {
    type: Boolean,
    default: false
  },
  /** Callback при возникновении ошибки */
  onError: {
    type: Function as PropType<(error: CapturedError) => void>,
    default: null
  }
})

const emit = defineEmits<{
  (e: 'error', payload: CapturedError): void
  (e: 'retry'): void
}>()

const capturedError = ref<CapturedError | null>(null)

onErrorCaptured((error: Error, _instance, info: string) => {
  const errorPayload: CapturedError = {
    error,
    info,
    timestamp: Date.now()
  }

  capturedError.value = errorPayload
  
  console.error('[ErrorBoundary] Captured error:', error, '\nInfo:', info)
  
  emit('error', errorPayload)
  props.onError?.(errorPayload)

  // Возвращаем false чтобы остановить propagation (если не указано иное)
  return props.propagate
})

function handleRetry(): void {
  capturedError.value = null
  emit('retry')
}

function resetError(): void {
  capturedError.value = null
}

// Expose для программного сброса
defineExpose({ resetError })
</script>

<template>
  <template v-if="capturedError && showFallback">
    <slot name="fallback" :error="capturedError" :retry="handleRetry">
      <div class="error-boundary">
        <div class="error-boundary__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        
        <h3 class="error-boundary__title">{{ errorTitle }}</h3>
        <p class="error-boundary__description">{{ errorDescription }}</p>
        
        <button 
          class="error-boundary__retry" 
          type="button"
          @click="handleRetry"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ retryLabel }}
        </button>

        <details v-if="capturedError" class="error-boundary__details">
          <summary>Технические детали</summary>
          <pre>{{ capturedError.error.message }}
{{ capturedError.error.stack }}</pre>
        </details>
      </div>
    </slot>
  </template>
  
  <slot v-else />
</template>

<style scoped>
.error-boundary {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8, 32px) var(--spacing-4, 16px);
  text-align: center;
  min-height: 200px;
}

.error-boundary__icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--spacing-4, 16px);
  color: var(--color-error, #ef4444);
  opacity: 0.8;
}

.error-boundary__icon svg {
  width: 100%;
  height: 100%;
}

.error-boundary__title {
  margin: 0 0 var(--spacing-2, 8px);
  font-size: var(--text-lg, 18px);
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.error-boundary__description {
  margin: 0 0 var(--spacing-6, 24px);
  font-size: var(--text-base, 16px);
  color: var(--text-muted, #6b7280);
  max-width: 400px;
}

.error-boundary__retry {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-2, 8px) var(--spacing-4, 16px);
  font-size: var(--text-sm, 14px);
  font-weight: 500;
  color: var(--color-primary, #2563eb);
  background: var(--surface-elevated, #fff);
  border: 1px solid var(--border-default, #e5e7eb);
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: all 150ms ease;
}

.error-boundary__retry:hover {
  background: var(--surface-hover, #f9fafb);
  border-color: var(--color-primary, #2563eb);
}

.error-boundary__retry svg {
  width: 16px;
  height: 16px;
}

.error-boundary__details {
  margin-top: var(--spacing-6, 24px);
  width: 100%;
  max-width: 600px;
  text-align: left;
}

.error-boundary__details summary {
  font-size: var(--text-sm, 14px);
  color: var(--text-muted, #6b7280);
  cursor: pointer;
  user-select: none;
}

.error-boundary__details pre {
  margin-top: var(--spacing-2, 8px);
  padding: var(--spacing-3, 12px);
  font-size: var(--text-xs, 12px);
  font-family: monospace;
  color: var(--text-muted, #6b7280);
  background: var(--surface-subtle, #f3f4f6);
  border-radius: var(--radius-sm, 4px);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

/* Dark mode */
:root[data-theme="dark"] .error-boundary__title {
  color: var(--text-primary-dark, #f3f4f6);
}

:root[data-theme="dark"] .error-boundary__retry {
  background: var(--surface-elevated-dark, #374151);
  border-color: var(--border-default-dark, #4b5563);
  color: var(--color-primary-light, #60a5fa);
}

:root[data-theme="dark"] .error-boundary__retry:hover {
  background: var(--surface-hover-dark, #4b5563);
}

:root[data-theme="dark"] .error-boundary__details pre {
  background: var(--surface-subtle-dark, #1f2937);
}
</style>
