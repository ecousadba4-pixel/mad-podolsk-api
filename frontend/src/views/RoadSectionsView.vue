<script setup lang="ts">
/**
 * RoadSectionsView — Раздел Участки дороги
 * Отображает таблицу участков дорог с поиском
 */
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoadSectionsStore } from '@/store/roadSectionsStore'
import { UiInput, UiCard } from '@/components/ui'
import { TableSkeleton, EmptyState } from '@/components/common'
import { formatNumber } from '@/utils/format'

const store = useRoadSectionsStore()
const { searchQuery, isLoading, rows, total } = storeToRefs(store)

onMounted(() => store.init())
</script>

<template>
  <div class="road-sections-view">
    <div class="road-sections-view__header">
      <h2 class="road-sections-view__title">Участки дороги</h2>
      <span class="road-sections-view__count">{{ total }} записей</span>
    </div>

    <!-- Filters -->
    <UiCard class="road-sections-view__filters">
      <div class="road-sections-filters">
        <div class="road-sections-filters__search">
          <label class="road-sections-filters__label">Поиск по названию участка</label>
          <UiInput 
            v-model="searchQuery" 
            placeholder="Введите минимум 3 символа..."
            class="road-sections-filters__input"
          />
        </div>
      </div>
    </UiCard>

    <!-- Table -->
    <UiCard class="road-sections-view__table-card">
      <TableSkeleton v-if="isLoading" :rows="10" :cols="5" />
      
      <EmptyState 
        v-else-if="rows.length === 0" 
        title="Участки дороги не найдены"
        description="Попробуйте изменить параметры поиска"
      />

      <div v-else class="road-sections-table-wrapper">
        <table class="road-sections-table">
          <thead>
            <tr>
              <th>Участок дороги</th>
              <th class="road-sections-table__col-num">Длина, км</th>
              <th class="road-sections-table__col-num">Ширина, м</th>
              <th class="road-sections-table__col-num">Паспорт дороги</th>
              <th class="road-sections-table__col-num">Паспорт тротуар</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.road_section_id">
              <td class="road-sections-table__cell-name">{{ row.road_section_name || '—' }}</td>
              <td class="road-sections-table__col-num">{{ formatNumber(row.length_km) }}</td>
              <td class="road-sections-table__col-num">{{ formatNumber(row.width_m) }}</td>
              <td class="road-sections-table__col-num">{{ formatNumber(row.passport_volume) }}</td>
              <td class="road-sections-table__col-num">{{ formatNumber(row.sidewalk_passport_volume) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>

<style scoped lang="scss">
.road-sections-view {
  display: flex;
  flex-direction: column;
  gap: var(--card-frame-gap);
}

.road-sections-view__header {
  display: flex;
  align-items: baseline;
  gap: var(--gap-md);
}

.road-sections-view__title {
  margin: 0;
  font-size: var(--font-size-h1);
  font-weight: 700;
  color: var(--text-main);
}

.road-sections-view__count {
  font-size: var(--font-size-body-sm);
  color: var(--text-muted);
}

.road-sections-view__filters {
  padding: var(--card-padding);
}

.road-sections-filters {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.road-sections-filters__search {
  display: flex;
  flex-direction: column;
  gap: var(--gap-xs);
}

.road-sections-filters__label {
  font-size: var(--font-size-caption);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.road-sections-filters__input {
  max-width: 400px;
}

.road-sections-view__table-card {
  padding: 0;
  overflow: hidden;
}

.road-sections-table-wrapper {
  overflow-x: auto;
}

.road-sections-table {
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

.road-sections-table__cell-name {
  max-width: 400px;
}

.road-sections-table__col-num {
  text-align: right;
  font-weight: 500;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

@media (max-width: 768px) {
  .road-sections-table {
    font-size: var(--font-size-caption);

    th, td {
      padding: var(--gap-sm) var(--gap-md);
    }
  }
}
</style>
