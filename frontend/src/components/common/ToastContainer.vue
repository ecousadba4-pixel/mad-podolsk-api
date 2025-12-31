<script setup lang="ts">
import { computed } from 'vue'
import { useToast, type Toast, type ToastType } from '../../composables/useToast'

const { toasts, dismiss } = useToast()

const ICONS: Record<ToastType, string> = {
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z'
}

const visibleToasts = computed(() => toasts.value.slice(-5)) // Максимум 5 toast

function getIcon(type: ToastType): string {
  return ICONS[type]
}

function handleAction(toast: Toast): void {
  toast.action?.handler()
  dismiss(toast.id)
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-container" role="region" aria-label="Уведомления">
      <TransitionGroup name="toast">
        <div
          v-for="t in visibleToasts"
          :key="t.id"
          :class="['toast', `toast--${t.type}`]"
          role="alert"
        >
          <svg 
            class="toast__icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path :d="getIcon(t.type)" />
          </svg>

          <div class="toast__content">
            <p class="toast__message">{{ t.message }}</p>
            <button
              v-if="t.action"
              class="toast__action"
              type="button"
              @click="handleAction(t)"
            >
              {{ t.action.label }}
            </button>
          </div>

          <button
            v-if="t.dismissible"
            class="toast__close"
            type="button"
            aria-label="Закрыть"
            @click="dismiss(t.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  bottom: var(--spacing-4, 16px);
  right: var(--spacing-4, 16px);
  left: var(--spacing-4, 16px);
  z-index: var(--z-toast, 9999);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2, 8px);
  pointer-events: none;
}

@media (min-width: 640px) {
  .toast-container {
    left: auto;
    max-width: 420px;
  }
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3, 12px);
  padding: var(--spacing-3, 12px) var(--spacing-4, 16px);
  background: var(--surface-elevated, #fff);
  border-radius: var(--radius-lg, 12px);
  box-shadow: var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.15));
  pointer-events: auto;
  border-left: 4px solid;
}

.toast--info {
  border-left-color: var(--color-info, #3b82f6);
}

.toast--success {
  border-left-color: var(--color-success, #22c55e);
}

.toast--warning {
  border-left-color: var(--color-warning, #f59e0b);
}

.toast--error {
  border-left-color: var(--color-error, #ef4444);
}

.toast__icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.toast--info .toast__icon {
  color: var(--color-info, #3b82f6);
}

.toast--success .toast__icon {
  color: var(--color-success, #22c55e);
}

.toast--warning .toast__icon {
  color: var(--color-warning, #f59e0b);
}

.toast--error .toast__icon {
  color: var(--color-error, #ef4444);
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__message {
  margin: 0;
  font-size: var(--text-sm, 14px);
  line-height: 1.4;
  color: var(--text-primary, #1f2937);
}

.toast__action {
  margin-top: var(--spacing-2, 8px);
  padding: 0;
  font-size: var(--text-sm, 14px);
  font-weight: 500;
  color: var(--color-primary, #2563eb);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.toast__action:hover {
  color: var(--color-primary-hover, #1d4ed8);
}

.toast__close {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  margin: -4px -4px -4px 0;
  background: none;
  border: none;
  border-radius: var(--radius-sm, 4px);
  cursor: pointer;
  color: var(--text-muted, #9ca3af);
  transition: color 150ms ease, background 150ms ease;
}

.toast__close:hover {
  color: var(--text-primary, #1f2937);
  background: var(--surface-hover, rgba(0, 0, 0, 0.05));
}

.toast__close svg {
  width: 16px;
  height: 16px;
}

/* Animations */
.toast-enter-active {
  animation: toast-in 300ms ease-out;
}

.toast-leave-active {
  animation: toast-out 200ms ease-in;
}

.toast-move {
  transition: transform 300ms ease;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

@keyframes toast-out {
  from {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateX(100%) scale(0.9);
  }
}

/* Dark mode */
:root[data-theme="dark"] .toast {
  background: var(--surface-elevated-dark, #1f2937);
  box-shadow: var(--shadow-lg-dark, 0 10px 25px rgba(0, 0, 0, 0.4));
}

:root[data-theme="dark"] .toast__message {
  color: var(--text-primary-dark, #f3f4f6);
}

:root[data-theme="dark"] .toast__close {
  color: var(--text-muted-dark, #6b7280);
}

:root[data-theme="dark"] .toast__close:hover {
  color: var(--text-primary-dark, #f3f4f6);
  background: var(--surface-hover-dark, rgba(255, 255, 255, 0.1));
}
</style>
