<script setup lang="ts">
/**
 * FuelByDriverTable — таблица потребления топлива по водителю
 *
 * Паттерн: аналогичен MileageByVehicleTable.vue
 */
import type { FuelByDriverResponse } from '@/api/fuel'
import { computed } from 'vue'
import { UiCard } from '@/components/ui'
import { formatDateShort } from '@/utils/format'

const props = defineProps<{
  data: FuelByDriverResponse | null
  isLoading?: boolean
}>()

function formatDate(dateStr: string): string {
  return formatDateShort(dateStr)
}

function formatKm(value: number): string {
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatLiters(value: number): string {
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatMoney(value: number): string {
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const totalMileage = computed(() => {
  if (!props.data) return 0
  return props.data.total_mileage
})

const totalLiters = computed(() => {
  if (!props.data) return 0
  return props.data.total_liters
})

const totalAmount = computed(() => {
  if (!props.data) return 0
  return props.data.total_amount
})
</script>

<template>
  <UiCard class="fuel-table">
    <h3 class="fuel-table__title">
      <span class="fuel-table__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <template v-if="data?.employee_name">
        {{ data.employee_name }}
      </template>
      <template v-else>
        Потребление по водителю
      </template>
    </h3>

    <div v-if="isLoading" class="fuel-table__loading">
      Загрузка...
    </div>

    <div v-else-if="!data" class="fuel-table__empty">
      Выберите водителя и диапазон дат, затем нажмите «Применить»
    </div>

    <div v-else-if="data.items.length === 0" class="fuel-table__empty">
      Нет данных о потреблении топлива за выбранный период
    </div>

    <div v-else class="fuel-table__content">
      <div class="fuel-table__scroll">
        <table class="fuel-table__table">
          <thead>
            <tr>
              <th class="fuel-table__th">Дата</th>
              <th class="fuel-table__th fuel-table__th--right">Пробег, км</th>
              <th class="fuel-table__th fuel-table__th--right">Топливо, л</th>
              <th class="fuel-table__th">Тип топлива</th>
              <th class="fuel-table__th fuel-table__th--right">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in data.items" :key="idx">
              <td class="fuel-table__td">{{ formatDate(item.date) }}</td>
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

      <!-- Totals -->
      <div class="fuel-table__totals">
        <div class="fuel-table__total-row">
          <span>Итого за период:</span>
          <div class="fuel-table__total-values">
            <div class="fuel-table__total-item">
              <span class="fuel-table__total-label">Пробег</span>
              <strong>{{ formatKm(totalMileage) }} км</strong>
            </div>
            <div class="fuel-table__total-item">
              <span class="fuel-table__total-label">Топливо</span>
              <strong>{{ formatLiters(totalLiters) }} л</strong>
            </div>
            <div class="fuel-table__total-item">
              <span class="fuel-table__total-label">Стоимость</span>
              <strong>{{ formatMoney(totalAmount) }} ₽</strong>
            </div>
          </div>
        </div>
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

  &--right {
    text-align: right;
  }

  &--value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }
}

.fuel-table__totals {
  margin-top: var(--gap-md);
  background: var(--overlay-accent-soft);
  border-radius: var(--radius-md);
  padding: var(--gap-md);
}

.fuel-table__total-row {
  display: flex;
  flex-direction: column;
  gap: var(--gap-md);

  > span {
    font-size: var(--font-size-body);
    font-weight: 600;
    color: var(--text-main);
  }
}

.fuel-table__total-values {
  display: flex;
  flex-wrap: wrap;
  gap: var(--gap-lg);
}

.fuel-table__total-item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.fuel-table__total-label {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.fuel-table__total-item strong {
  font-size: var(--font-size-h3);
  color: var(--accent);
}

@media (max-width: 768px) {
  .fuel-table {
    padding: var(--gap-md);
  }

  .fuel-table__scroll {
    overflow-x: auto;
  }

  .fuel-table__table {
    min-width: 500px;
  }

  .fuel-table__th,
  .fuel-table__td {
    padding: var(--gap-xs) var(--gap-sm);
    font-size: var(--font-size-caption);
  }

  .fuel-table__totals {
    padding: var(--gap-sm) var(--gap-md);
  }

  .fuel-table__total-values {
    gap: var(--gap-md);
  }

  .fuel-table__total-item strong {
    font-size: var(--font-size-body);
  }
}
</style>
