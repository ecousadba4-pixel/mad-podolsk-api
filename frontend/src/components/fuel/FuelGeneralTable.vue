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
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatLiters(value: number): string {
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatMoney(value: number): string {
  return Math.round(Number(value)).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
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
      <!-- Desktop: table view -->
      <div class="fuel-table__scroll fuel-table__desktop">
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
          <tfoot>
            <tr class="fuel-table__total-row">
              <td class="fuel-table__td fuel-table__td--total" colspan="4">Итого:</td>
              <td class="fuel-table__td fuel-table__td--total fuel-table__td--right">
                {{ formatLiters(data.total_liters) }} л
              </td>
              <td class="fuel-table__td fuel-table__td--total"></td>
              <td class="fuel-table__td fuel-table__td--total fuel-table__td--right">
                {{ formatMoney(data.total_amount) }} ₽
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Mobile: card view -->
      <div class="fuel-cards fuel-table__mobile">
        <div
          v-for="(item, idx) in data.items"
          :key="idx"
          class="fuel-card"
        >
          <div class="fuel-card__header">
            <span class="fuel-card__name">{{ item.employee_name }}</span>
            <span v-if="item.type_of_gas" class="fuel-card__gas-badge">{{ item.type_of_gas }}</span>
          </div>
          <div class="fuel-card__vehicle">
            <span class="fuel-card__type">{{ item.vehicle_type_name }}</span>
            <span v-if="item.plate_number" class="fuel-card__plate">{{ item.plate_number }}</span>
          </div>
          <div class="fuel-card__metrics">
            <div class="fuel-card__metric">
              <span class="fuel-card__label">Пробег</span>
              <span class="fuel-card__value">{{ formatKm(item.mileage_km) }} км</span>
            </div>
            <div class="fuel-card__metric">
              <span class="fuel-card__label">Топливо</span>
              <span class="fuel-card__value">{{ formatLiters(item.liters_total) }} л</span>
            </div>
            <div class="fuel-card__metric">
              <span class="fuel-card__label">Стоимость</span>
              <span class="fuel-card__value">{{ formatMoney(item.amount_for_fuel) }} ₽</span>
            </div>
          </div>

        </div>

        <!-- Mobile totals -->
        <div class="fuel-cards__totals">
          <span class="fuel-cards__totals-title">Итого:</span>
          <div class="fuel-cards__totals-row">
            <div class="fuel-card__metric">
              <span class="fuel-card__label">Топливо</span>
              <span class="fuel-card__value fuel-card__value--accent">{{ formatLiters(data.total_liters) }} л</span>
            </div>
            <div class="fuel-card__metric">
              <span class="fuel-card__label">Стоимость</span>
              <span class="fuel-card__value fuel-card__value--accent">{{ formatMoney(data.total_amount) }} ₽</span>
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

.fuel-table__total-row {
  background: var(--overlay-accent-soft);
}

.fuel-table__td--total {
  font-size: var(--font-size-body) !important;
  font-weight: 700 !important;
  color: var(--accent) !important;
  border-bottom: none !important;
  padding-top: var(--gap-md) !important;
  padding-bottom: var(--gap-md) !important;
  font-variant-numeric: tabular-nums;
}

/* ── Mobile card view ── */
.fuel-table__mobile {
  display: none;
}

.fuel-cards {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.fuel-card {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md, 8px);
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.fuel-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.fuel-card__name {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
  line-height: 1.3;
}

.fuel-card__vehicle {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  flex-wrap: wrap;
}

.fuel-card__type {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
}

.fuel-card__plate {
  font-size: var(--font-size-caption);
  font-weight: 600;
  color: var(--text-main);
}

.fuel-card__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--gap-xs);
  margin-top: var(--gap-xs);
}

.fuel-card__metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fuel-card__label {
  font-size: var(--font-size-caption);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  font-weight: 500;
}

.fuel-card__value {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--accent);

  &--accent {
    font-size: var(--font-size-body);
    font-weight: 700;
  }
}

.fuel-card__gas-badge {
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  background: var(--overlay-accent-soft);
  padding: 2px 8px;
  border-radius: var(--radius-sm, 4px);
  white-space: nowrap;
}

.fuel-cards__totals {
  background: var(--overlay-accent-soft);
  border-radius: var(--radius-md, 8px);
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
}

.fuel-cards__totals-title {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--accent);
}

.fuel-cards__totals-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--gap-sm);
}

/* ── Responsive ── */

@media (max-width: 768px) {
  .fuel-table {
    padding: var(--gap-md);
  }

  .fuel-table__desktop {
    display: none;
  }

  .fuel-table__mobile {
    display: flex;
  }
}
</style>
