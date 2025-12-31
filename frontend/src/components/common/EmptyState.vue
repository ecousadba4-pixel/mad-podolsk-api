<script setup lang="ts">
import { computed, type PropType } from 'vue'

type EmptyStateVariant = 'default' | 'search' | 'filter' | 'error' | 'offline'

const props = defineProps({
  /** Вариант пустого состояния */
  variant: {
    type: String as PropType<EmptyStateVariant>,
    default: 'default'
  },
  /** Заголовок */
  title: {
    type: String,
    default: ''
  },
  /** Описание */
  description: {
    type: String,
    default: ''
  },
  /** Показывать иконку */
  showIcon: {
    type: Boolean,
    default: true
  },
  /** Текст кнопки действия */
  actionLabel: {
    type: String,
    default: ''
  },
  /** Компактный режим */
  compact: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'action'): void
}>()

const VARIANTS = {
  default: {
    title: 'Нет данных',
    description: 'Данные для отображения отсутствуют',
    icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
  },
  search: {
    title: 'Ничего не найдено',
    description: 'Попробуйте изменить параметры поиска',
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  },
  filter: {
    title: 'Нет результатов',
    description: 'Данные не соответствуют выбранным фильтрам',
    icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
  },
  error: {
    title: 'Ошибка загрузки',
    description: 'Не удалось загрузить данные',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
  },
  offline: {
    title: 'Нет подключения',
    description: 'Проверьте интернет-соединение',
    icon: 'M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414'
  }
}

const config = computed(() => VARIANTS[props.variant] || VARIANTS.default)

const displayTitle = computed(() => props.title || config.value.title)
const displayDescription = computed(() => props.description || config.value.description)
</script>

<template>
  <div :class="['empty-state', { 'empty-state--compact': compact }]" role="status">
    <div v-if="showIcon" class="empty-state__icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" :d="config.icon" />
        </svg>
      </slot>
    </div>

    <h3 v-if="displayTitle" class="empty-state__title">
      {{ displayTitle }}
    </h3>

    <p v-if="displayDescription" class="empty-state__description">
      {{ displayDescription }}
    </p>

    <div v-if="actionLabel || $slots.action" class="empty-state__actions">
      <slot name="action">
        <button 
          class="empty-state__button" 
          type="button"
          @click="emit('action')"
        >
          {{ actionLabel }}
        </button>
      </slot>
    </div>

    <slot />
  </div>
</template>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-8, 32px) var(--spacing-4, 16px);
  text-align: center;
  min-height: 200px;
}

.empty-state--compact {
  padding: var(--spacing-4, 16px);
  min-height: 120px;
}

.empty-state__icon {
  width: 56px;
  height: 56px;
  margin-bottom: var(--spacing-4, 16px);
  color: var(--text-muted, #9ca3af);
  opacity: 0.6;
}

.empty-state--compact .empty-state__icon {
  width: 40px;
  height: 40px;
  margin-bottom: var(--spacing-2, 8px);
}

.empty-state__icon svg {
  width: 100%;
  height: 100%;
}

.empty-state__title {
  margin: 0 0 var(--spacing-2, 8px);
  font-size: var(--text-lg, 18px);
  font-weight: 600;
  color: var(--text-primary, #1f2937);
}

.empty-state--compact .empty-state__title {
  font-size: var(--text-base, 16px);
}

.empty-state__description {
  margin: 0;
  font-size: var(--text-base, 16px);
  color: var(--text-muted, #6b7280);
  max-width: 320px;
}

.empty-state--compact .empty-state__description {
  font-size: var(--text-sm, 14px);
}

.empty-state__actions {
  margin-top: var(--spacing-4, 16px);
}

.empty-state__button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2, 8px);
  padding: var(--spacing-2, 8px) var(--spacing-4, 16px);
  font-size: var(--text-sm, 14px);
  font-weight: 500;
  color: #fff;
  background: var(--color-primary, #2563eb);
  border: none;
  border-radius: var(--radius-md, 8px);
  cursor: pointer;
  transition: background 150ms ease;
}

.empty-state__button:hover {
  background: var(--color-primary-hover, #1d4ed8);
}

/* Dark mode */
:root[data-theme="dark"] .empty-state__title {
  color: var(--text-primary-dark, #f3f4f6);
}

:root[data-theme="dark"] .empty-state__description {
  color: var(--text-muted-dark, #9ca3af);
}
</style>
