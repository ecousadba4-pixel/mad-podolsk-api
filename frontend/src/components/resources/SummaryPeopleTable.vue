<script setup lang="ts">
/**
 * SummaryPeopleTable — таблица людей (мастера + рабочие) в сводке
 */
import type { SummaryPeople } from '@/api/resources'
import { UiCard } from '@/components/ui'

defineProps<{
  data: SummaryPeople | null
  isLoading?: boolean
}>()
</script>

<template>
  <UiCard class="people-summary">
    <h3 class="people-summary__title">
      <span class="people-summary__icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </span>
      Люди работающие сейчас
    </h3>

    <div v-if="isLoading" class="people-summary__loading">
      Загрузка...
    </div>

    <div v-else-if="!data || data.grand_total === 0" class="people-summary__empty">
      Нет данных о людях на выбранную дату/время
    </div>

    <div v-else class="people-summary__content">
      <!-- Masters list -->
      <div v-if="data.masters.length > 0" class="people-summary__section">
        <div class="people-summary__section-header">
          <span>Мастера</span>
          <span class="people-summary__section-count">{{ data.total_masters }}</span>
        </div>
        <table class="people-summary__table">
          <thead>
            <tr>
              <th>ФИО мастера</th>
              <th>Рабочих</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="master in data.masters" :key="master.master_id">
              <td class="people-summary__name">{{ master.master_full_name }}</td>
              <td class="people-summary__count">{{ master.workers_count }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary -->
      <div class="people-summary__totals">
        <div class="people-summary__total-row">
          <span>Мастеров:</span>
          <strong>{{ data.total_masters }}</strong>
        </div>
        <div class="people-summary__total-row">
          <span>Рабочих:</span>
          <strong>{{ data.total_workers }}</strong>
        </div>
        <div class="people-summary__total-row people-summary__total-row--grand">
          <span>Всего людей:</span>
          <strong>{{ data.grand_total }}</strong>
        </div>
      </div>
    </div>
  </UiCard>
</template>

<style scoped lang="scss">
.people-summary {
  padding: var(--card-padding);
}

.people-summary__title {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  margin: 0 0 var(--gap-lg) 0;
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--text-main);
}

.people-summary__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.people-summary__loading,
.people-summary__empty {
  padding: var(--gap-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-body-sm);
}

.people-summary__content {
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
}

.people-summary__section {
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.people-summary__section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--gap-sm) var(--gap-md);
  background: var(--bg-muted);
  border-bottom: 1px solid var(--border-soft);
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
}

.people-summary__section-count {
  font-weight: 700;
  color: var(--accent);
}

.people-summary__table {
  width: 100%;
  border-collapse: collapse;

  th, td {
    padding: var(--gap-sm) var(--gap-md);
    text-align: left;
  }

  th {
    font-size: var(--font-size-caption);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    background: var(--bg-muted);
    border-bottom: 1px solid var(--border-soft);
  }

  tr:not(:last-child) td {
    border-bottom: 1px solid var(--border-soft);
  }
}

.people-summary__name {
  font-size: var(--font-size-body-sm);
  color: var(--text-main);
}

.people-summary__count {
  text-align: right !important;
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--text-main);
  width: 80px;
}

.people-summary__totals {
  display: flex;
  flex-direction: column;
  gap: var(--gap-sm);
  padding: var(--gap-md);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}

.people-summary__total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-body-sm);

  span {
    color: var(--text-muted);
  }

  strong {
    font-weight: 600;
    color: var(--text-main);
  }

  &--grand {
    padding-top: var(--gap-sm);
    border-top: 1px solid var(--border-soft);
    font-size: var(--font-size-body);

    span {
      color: var(--text-main);
    }

    strong {
      font-size: var(--font-size-h3);
      color: var(--accent);
    }
  }
}
</style>
