<script setup lang="ts">
/**
 * FuelGeneralTable — таблица общих данных потребления топлива
 *
 * Паттерн: аналогичен MileageByDateTable.vue
 */
import type { FuelGeneralResponse } from '@/api/fuel'
import { UiCard } from '@/components/ui'

defineProps<{
  data: FuelGeneralResponse | null
  isLoading?: boolean
}>()

function formatKm(value: number): string {
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatLiters(value: number): string {
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatMoney(value: number): string {
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>

<template>
  <UiCard class="fuel-table">
    <h3 class="fuel-table__title">
      <span class="fuel-table__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 22V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16"/>
          <path d="M13 10h4a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 4"/>
          <path d="M7 22v-4"/>
          <path d="M3 22h10"/>
        </svg>
      </span>
      Потребление топлива
    </h3>

    <div v-if="isLoading" class="fuel-table__loading">
      Загрузка...
    </div>

    <div v-else-if="!data || data.items.length === 0" class="fuel-table__empty">
      Нет данных о потреблении топлива на выбранную дату
    </div>

    <div v-else class="fuel-table__content">
      <div class="fuel-table__scroll">
        <table class="fuel-table__table">
          <thead>
            <tr>
              <th class="fuel-table__th">Водитель</th>
              <th class="fuel-table__th">Тип техники</th>
              <th class="fuel-table__th">Номер машины</th>
              <th class="fuel-table__th fuel-table__th--right">Пробег, км</th>
              <th class="fuel-table__th fuel-table__th--right">Топливо, л</th>
              <th class="fuel-table__th">Тип топлива</th>
              <th class="fuel-table__th fuel-table__th--right">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in data.items" :key="idx">
              <td class="fuel-table__td">{{ item.employee_name }}</td>
              <td class="fuel-table__td">{{ item.vehicle_type_name }}</td>
              <td class="fuel-table__td fuel-table__td--plate">{{ item.plate_number }}</td>
              <td class="fuel-table__td fuel-table__td--right fuel-table__td--value">
                {{ formatKm(item.mileage_km) }}
              </td>
              <td class="fuel-table__td fuel-table__td--right fuel-table__td--value">
                {{ formatLiters(item.liters_total) }}
              </td>
              <td class="fuel-table__td">{{ item.type_of_gas || '—' }}</td>
              <td class="fuel-table__td fuel-table__td--right fuel-table__td--value">
                {{ formatMoney(item.amount_for_fuel) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div class="fuel-table__total">
        <span>Итого:</span>
        <strong>{{ formatMoney(data.total_amount) }} ₽</strong>
      </div>
    </div>
  </UiCard>
</template>

<style scoped lang="scss">
.fuel-table {
  padding: var(--card-padding);
}

.fuel-table__title {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  margin: 0 0 var(--gap-lg) 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.fuel-table__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.fuel-table__loading,
.fuel-table__empty {
  padding: var(--gap-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-body-sm);
}

.fuel-table__content {
  display: flex;
  flex-direction: column;
}

.fuel-table__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.fuel-table__table {
  width: 100%;
  border-collapse: collapse;
}

.fuel-table__th {
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

.fuel-table__td {
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

.fuel-table__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-md);
  margin-top: var(--gap-md);
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

@media (max-width: 768px) {
  .fuel-table {
    padding: var(--gap-md);
  }

  .fuel-table__scroll {
    overflow-x: auto;
  }

  .fuel-table__table {
    min-width: 700px;
  }

  .fuel-table__th,
  .fuel-table__td {
    padding: var(--gap-xs) var(--gap-sm);
    font-size: var(--font-size-caption);
  }

  .fuel-table__total {
    padding: var(--gap-sm) var(--gap-md);

    strong {
      font-size: var(--font-size-body);
    }
  }
}
</style>
