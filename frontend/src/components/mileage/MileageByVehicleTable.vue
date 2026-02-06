<script setup lang="ts">
/**
 * MileageByVehicleTable — таблица пробега по машине
 */
import type { MileageByVehicleResponse } from '@/api/mileage'
import { computed } from 'vue'
import { UiCard } from '@/components/ui'

const props = defineProps<{
  data: MileageByVehicleResponse | null
  isLoading?: boolean
}>()

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatKm(value: number): string {
  return Number(value).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalMileage = computed(() => {
  if (!props.data) return 0
  return props.data.items.reduce((sum, item) => sum + Number(item.mileage_km), 0)
})
</script>

<template>
  <UiCard class="mileage-table">
    <h3 class="mileage-table__title">
      <span class="mileage-table__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"/>
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
      </span>
      <template v-if="data?.plate_number">
        {{ data.vehicle_type_name }} — {{ data.plate_number }}
      </template>
      <template v-else>
        Пробег по машине
      </template>
    </h3>

    <div v-if="isLoading" class="mileage-table__loading">
      Загрузка...
    </div>

    <div v-else-if="!data" class="mileage-table__empty">
      Выберите машину и диапазон дат, затем нажмите «Применить»
    </div>

    <div v-else-if="data.items.length === 0" class="mileage-table__empty">
      Нет данных о пробеге за выбранный период
    </div>

    <div v-else class="mileage-table__content">
      <div class="mileage-table__scroll">
        <table class="mileage-table__table">
          <thead>
            <tr>
              <th class="mileage-table__th">Дата</th>
              <th class="mileage-table__th mileage-table__th--right">Пробег, км</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in data.items" :key="idx">
              <td class="mileage-table__td">{{ formatDate(item.date) }}</td>
              <td class="mileage-table__td mileage-table__td--right mileage-table__td--value">
                {{ formatKm(item.mileage_km) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Total -->
      <div class="mileage-table__total">
        <span>Итого за период:</span>
        <strong>{{ formatKm(totalMileage) }} км</strong>
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

  &--right {
    text-align: right;
  }

  &--value {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    color: var(--accent);
  }
}

.mileage-table__total {
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
  .mileage-table {
    padding: var(--gap-md);
  }

  .mileage-table__th,
  .mileage-table__td {
    padding: var(--gap-xs) var(--gap-sm);
    font-size: var(--font-size-caption);
  }

  .mileage-table__total {
    padding: var(--gap-sm) var(--gap-md);

    strong {
      font-size: var(--font-size-body);
    }
  }
}
</style>
