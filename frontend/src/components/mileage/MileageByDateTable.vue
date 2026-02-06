<script setup lang="ts">
/**
 * MileageByDateTable — таблица пробега по дате
 */
import type { MileageByDateResponse } from '@/api/mileage'
import { UiCard } from '@/components/ui'

defineProps<{
  data: MileageByDateResponse | null
  isLoading?: boolean
}>()

function formatKm(value: number): string {
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <UiCard class="mileage-table">
    <h3 class="mileage-table__title">
      <span class="mileage-table__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </span>
      Пробег за дату
    </h3>

    <div v-if="isLoading" class="mileage-table__loading">
      Загрузка...
    </div>

    <div v-else-if="!data || data.items.length === 0" class="mileage-table__empty">
      Нет данных о пробеге на выбранную дату/время
    </div>

    <div v-else class="mileage-table__content">
      <div class="mileage-table__scroll">
        <table class="mileage-table__table">
          <thead>
            <tr>
              <th class="mileage-table__th">Тип техники</th>
              <th class="mileage-table__th">Номер машины</th>
              <th class="mileage-table__th mileage-table__th--right">Пробег, км</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in data.items" :key="idx">
              <td class="mileage-table__td">{{ item.vehicle_type_name }}</td>
              <td class="mileage-table__td mileage-table__td--plate">{{ item.plate_number }}</td>
              <td class="mileage-table__td mileage-table__td--right mileage-table__td--value">
                {{ formatKm(item.mileage_km) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </UiCard>
</template>

<style scoped lang="scss">
.mileage-table {
  padding: var(--card-padding);
}

.mileage-table__title {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  margin: 0 0 var(--gap-lg) 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.mileage-table__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.mileage-table__loading,
.mileage-table__empty {
  padding: var(--gap-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-body-sm);
}

.mileage-table__content {
  display: flex;
  flex-direction: column;
}

.mileage-table__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.mileage-table__table {
  width: 100%;
  border-collapse: collapse;
}

.mileage-table__th {
  padding: var(--gap-sm) var(--gap-md);
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  text-align: left;
  border-bottom: 2px solid var(--border-soft);
  white-space: nowrap;

  &--right {
    text-align: right;
  }
}

.mileage-table__td {
  padding: var(--gap-sm) var(--gap-md);
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
  border-bottom: 1px solid var(--border-soft);

  &--plate {
    font-weight: 600;
    white-space: nowrap;
  }

  &--right {
    text-align: right;
  }

  &--value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }
}

@media (max-width: 768px) {
  .mileage-table {
    padding: var(--gap-md);
  }

  .mileage-table__th,
  .mileage-table__td {
    padding: var(--gap-xs) var(--gap-sm);
    font-size: var(--font-size-caption);
  }
}
</style>
