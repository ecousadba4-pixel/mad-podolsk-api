<script setup lang="ts">
/**
 * SummaryEquipmentTable — таблица техники в сводке
 */
import type { SummaryEquipment } from '@/api/resources'
import { UiCard } from '@/components/ui'

defineProps<{
  data: SummaryEquipment | null
  isLoading?: boolean
}>()
</script>

<template>
  <UiCard class="equipment-summary">
    <h3 class="equipment-summary__title">
      <span class="equipment-summary__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </span>
      Техника работающая сейчас
    </h3>

    <div v-if="isLoading" class="equipment-summary__loading">
      Загрузка...
    </div>

    <div v-else-if="!data || data.grand_total === 0" class="equipment-summary__empty">
      Нет данных о технике на выбранную дату/время
    </div>

    <div v-else class="equipment-summary__content">
      <!-- Groups -->
      <div 
        v-for="group in data.groups" 
        :key="group.is_own ? 'own' : 'rented'"
        class="equipment-summary__group"
      >
        <div class="equipment-summary__group-header">
          <span class="equipment-summary__group-label">{{ group.label }}</span>
          <span class="equipment-summary__group-total">{{ group.total }}</span>
        </div>
        <table class="equipment-summary__table">
          <tbody>
            <tr v-for="item in group.items" :key="item.equipment_type_id">
              <td class="equipment-summary__type">{{ item.equipment_type_name }}</td>
              <td class="equipment-summary__count">{{ item.count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Grand total -->
      <div class="equipment-summary__grand-total">
        <span>Всего техники:</span>
        <strong>{{ data.grand_total }}</strong>
      </div>
    </div>
  </UiCard>
</template>

<style scoped lang="scss">
.equipment-summary {
  padding: var(--card-padding);
}

.equipment-summary__title {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  margin: 0 0 var(--gap-lg) 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.equipment-summary__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.equipment-summary__loading,
.equipment-summary__empty {
  padding: var(--gap-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-body-sm);
}

.equipment-summary__content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.equipment-summary__group {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.equipment-summary__group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-soft);
}

.equipment-summary__group-label {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
}

.equipment-summary__group-total {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--accent);
}

.equipment-summary__table {
  width: 100%;
  border-collapse: collapse;

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--border-soft);
  }

  td {
    padding: var(--gap-sm) var(--gap-md);
  }
}

.equipment-summary__type {
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
}

.equipment-summary__count {
  text-align: right;
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
  width: 60px;
}

.equipment-summary__grand-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-md);
  background: var(--overlay-accent-soft);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);

  span {
    color: var(--text-main);
  }

  strong {
    font-size: var(--font-size-h3);
    color: var(--accent);
  }
}
</style>
