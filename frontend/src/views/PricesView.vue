<script setup lang="ts">
/**
 * PricesView — Раздел Расценки
 * Отображает таблицу расценок с поиском и фильтрацией
 */
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePricesStore } from '@/store/pricesStore'
import { UiInput, UiCard } from '@/components/ui'
import { TableSkeleton, EmptyState } from '@/components/common'
import { formatMoney } from '@/utils/format'

const store = usePricesStore()
const {
  searchQuery,
  selectedEstimate,
  selectedWorkType,
  isLoading,
  rows,
  total,
  estimates,
  workTypes,
  hasActiveFilters
} = storeToRefs(store)

onMounted(() => store.init())
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
        <div class="prices-filters__row">
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
        </div>

        <button 
          v-if="hasActiveFilters"
          class="prices-filters__reset"
          @click="store.resetFilters()"
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
              <th class="prices-table__col-desktop">Смета</th>
              <th class="prices-table__col-desktop">Раздел</th>
              <th class="prices-table__col-desktop">Тип работы</th>
              <th class="prices-table__col-work">Вид работы</th>
              <th class="prices-table__col-unit">Ед. изм.</th>
              <th class="prices-table__col-price">Расценка</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.price_id">
              <td class="prices-table__col-desktop">{{ row.estimate_name || '—' }}</td>
              <td class="prices-table__col-desktop">{{ row.estimate_section_name || '—' }}</td>
              <td class="prices-table__col-desktop">{{ row.work_type_name || '—' }}</td>
              <td class="prices-table__col-work">{{ row.work_name || '—' }}</td>
              <td class="prices-table__col-unit">{{ row.unit_name || '—' }}</td>
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
  gap: var(--gap-md);
}

.prices-filters__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--gap-lg);
}

.prices-filters__search {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  flex: 1;
  min-width: 200px;
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
  gap: var(--gap-md);
  flex-wrap: wrap;
}

.prices-filters__select-item {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
  min-width: 150px;
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

.prices-table__col-work {
  max-width: 300px;
}

.prices-table__col-unit {
  white-space: nowrap;
}

.prices-table__col-price {
  text-align: right;
  font-weight: 600;
  white-space: nowrap;
}

@media (max-width: 768px) {
  .prices-filters__row {
    flex-direction: column;
    align-items: stretch;
  }

  .prices-filters__search {
    min-width: 100%;
  }

  .prices-filters__input {
    max-width: 100%;
  }

  .prices-filters__select-group {
    flex-direction: column;
  }

  .prices-filters__select-item {
    min-width: 100%;
  }

  /* Скрываем колонки на мобильном: Смета, Раздел, Тип работы */
  .prices-table__col-desktop {
    display: none;
  }

  .prices-table {
    font-size: var(--font-size-body-sm);
    table-layout: fixed;
    width: 100%;

    th, td {
      padding: var(--gap-sm) var(--gap-md);
    }
  }

  /* Мобильная компоновка: Вид работы занимает основное пространство */
  .prices-table__col-work {
    width: auto;
    max-width: none;
    word-break: break-word;
  }

  /* Единицы измерения - выравнивание влево */
  .prices-table__col-unit {
    width: 70px;
    text-align: left;
    padding-right: var(--gap-lg) !important;
  }

  /* Расценка - компактно справа */
  .prices-table__col-price {
    width: 90px;
    padding-left: var(--gap-md) !important;
  }
}
</style>
