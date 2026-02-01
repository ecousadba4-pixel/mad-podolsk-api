<script setup lang="ts">
/**
 * PricesView — Раздел Расценки
 * Отображает таблицу расценок с поиском и фильтрацией
 */
import { ref, computed, watch, onMounted } from 'vue'
import { getPrices, getPricesFilters, type PriceRow, type EstimateOption, type WorkTypeOption } from '@/api/prices'
import { UiInput, UiCard } from '@/components/ui'
import { TableSkeleton, EmptyState } from '@/components/common'
import { formatMoney } from '@/utils/format'

// State
const searchQuery = ref('')
const selectedEstimate = ref<number | null>(null)
const selectedWorkType = ref<number | null>(null)
const isLoading = ref(false)
const rows = ref<PriceRow[]>([])
const total = ref(0)

// Filters
const estimates = ref<EstimateOption[]>([])
const workTypes = ref<WorkTypeOption[]>([])

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null

async function fetchFilters() {
  try {
    const response = await getPricesFilters()
    estimates.value = response.estimates
    workTypes.value = response.work_types
  } catch (e) {
    console.error('Failed to fetch filters:', e)
  }
}

async function fetchPrices() {
  isLoading.value = true
  try {
    const params: { search?: string; estimate_id?: number; work_type_id?: number } = {}
    if (searchQuery.value.length >= 3) {
      params.search = searchQuery.value
    }
    if (selectedEstimate.value !== null) {
      params.estimate_id = selectedEstimate.value
    }
    if (selectedWorkType.value !== null) {
      params.work_type_id = selectedWorkType.value
    }
    
    const response = await getPrices(params)
    rows.value = response.rows
    total.value = response.total
  } catch (e) {
    console.error('Failed to fetch prices:', e)
    rows.value = []
    total.value = 0
  } finally {
    isLoading.value = false
  }
}

// Watch for filter changes
watch([selectedEstimate, selectedWorkType], () => {
  fetchPrices()
})

// Debounced search
watch(searchQuery, (val) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  if (val.length >= 3 || val.length === 0) {
    searchTimeout = setTimeout(() => {
      fetchPrices()
    }, 300)
  }
})

function resetFilters() {
  searchQuery.value = ''
  selectedEstimate.value = null
  selectedWorkType.value = null
}

onMounted(async () => {
  await fetchFilters()
  await fetchPrices()
})
</script>

<template>
  <div class="prices-view">
    <div class="prices-view__header">
      <h2 class="prices-view__title">Расценки</h2>
      <span class="prices-view__count">{{ total }} записей</span>
    </div>

    <!-- Filters -->
    <UiCard class="prices-view__filters">
      <div class="prices-filters">
        <div class="prices-filters__search">
          <label class="prices-filters__label">Поиск по названию работы</label>
          <UiInput 
            v-model="searchQuery" 
            placeholder="Введите минимум 3 символа..."
            class="prices-filters__input"
          />
        </div>

        <div class="prices-filters__select-group">
          <div class="prices-filters__select-item">
            <label class="prices-filters__label">Смета</label>
            <select 
              v-model="selectedEstimate" 
              class="prices-filters__select"
            >
              <option :value="null">Все сметы</option>
              <option 
                v-for="est in estimates" 
                :key="est.estimate_id" 
                :value="est.estimate_id"
              >
                {{ est.estimate_name }}
              </option>
            </select>
          </div>

          <div class="prices-filters__select-item">
            <label class="prices-filters__label">Тип работы</label>
            <select 
              v-model="selectedWorkType" 
              class="prices-filters__select"
            >
              <option :value="null">Все типы</option>
              <option 
                v-for="wt in workTypes" 
                :key="wt.work_type_id" 
                :value="wt.work_type_id"
              >
                {{ wt.work_type_name }}
              </option>
            </select>
          </div>
        </div>

        <button 
          v-if="searchQuery || selectedEstimate !== null || selectedWorkType !== null"
          class="prices-filters__reset"
          @click="resetFilters"
        >
          Сбросить фильтры
        </button>
      </div>
    </UiCard>

    <!-- Table -->
    <UiCard class="prices-view__table-card">
      <TableSkeleton v-if="isLoading" :rows="10" :cols="6" />
      
      <EmptyState 
        v-else-if="rows.length === 0" 
        title="Расценки не найдены"
        description="Попробуйте изменить параметры поиска или фильтры"
      />

      <div v-else class="prices-table-wrapper">
        <table class="prices-table">
          <thead>
            <tr>
              <th>Смета</th>
              <th>Раздел</th>
              <th>Тип работы</th>
              <th>Вид работы</th>
              <th>Ед. изм.</th>
              <th class="prices-table__col-price">Расценка</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.price_id">
              <td>{{ row.estimate_name || '—' }}</td>
              <td>{{ row.estimate_section_name || '—' }}</td>
              <td>{{ row.work_type_name || '—' }}</td>
              <td class="prices-table__cell-work">{{ row.work_name || '—' }}</td>
              <td>{{ row.unit_name || '—' }}</td>
              <td class="prices-table__col-price">
                {{ row.unit_price !== null ? formatMoney(row.unit_price) : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>

<style scoped lang="scss">
.prices-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}

.prices-view__header {
  display: flex;
  align-items: baseline;
  gap: var(--gap-md);
}

.prices-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.prices-view__count {
  font-size: var(--font-size-body-sm);
  color: var(--text-muted);
}

.prices-view__filters {
  padding: var(--card-padding);
}

.prices-filters {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.prices-filters__search {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.prices-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.prices-filters__input {
  max-width: 400px;
}

.prices-filters__select-group {
  display: flex;
  gap: var(--gap-lg);
  flex-wrap: wrap;
}

.prices-filters__select-item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 200px;
}

.prices-filters__select {
  height: var(--control-height-sm);
  padding: 0 var(--gap-md);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--border-strong);
  }

  &:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
}

.prices-filters__reset {
  align-self: flex-start;
  padding: var(--gap-sm) var(--gap-md);
  border: none;
  background: var(--overlay-dark-hover);
  border-radius: var(--radius-sm);
  font-family: var(--font-sans);
  font-size: var(--font-size-caption);
  color: var(--text-muted);
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: var(--overlay-dark);
  }
}

.prices-view__table-card {
  padding: 0;
  overflow: hidden;
}

.prices-table-wrapper {
  overflow-x: auto;
}

.prices-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-body-sm);

  th, td {
    padding: var(--gap-md) var(--gap-lg);
    text-align: left;
    border-bottom: 1px solid var(--border-soft);
  }

  th {
    background: var(--bg-muted);
    font-weight: 600;
    color: var(--text-muted);
    font-size: var(--font-size-caption);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  tbody tr {
    transition: background-color 0.15s ease;

    &:hover {
      background: var(--overlay-dark-hover);
    }
  }

  td {
    color: var(--text-main);
  }
}

.prices-table__cell-work {
  max-width: 300px;
}

.prices-table__col-price {
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .prices-filters__select-group {
    flex-direction: column;
  }

  .prices-filters__select-item {
    min-width: 100%;
  }

  .prices-table {
    font-size: var(--font-size-caption);

    th, td {
      padding: var(--gap-sm) var(--gap-md);
    }
  }
}
</style>
