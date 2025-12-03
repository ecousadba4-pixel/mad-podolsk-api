<template>
  <PageSection variant="panel" class="smeta-panel smeta-details smeta-breakdown">
    <template #header>
      <div class="panel-title-group">
        <div v-if="isMobile" class="panel-title-mobile">
          <h3 class="panel-title-mobile-main">Работы по смете {{ smetaLabel }}</h3>
          <p class="panel-note-mobile">Детали по виду работы при нажатии</p>
        </div>
        <template v-else>
          <p class="panel-note">Детали по виду работы при нажатии</p>
          <h3 class="panel-title text-h3">{{ smetaLabel }}</h3>
        </template>
      </div>
    </template>

    <div v-if="loading && !filteredRows.length" class="skeleton">Загрузка...</div>

    <div v-else class="smeta-breakdown-scroll" :class="{ 'is-mobile': isMobile, 'is-loading': loading }">
      <SmetaDetails :items="filteredRows" :sort-key="sortKey" :sort-dir="sortDir" @select="openByDescription" />
    </div>
  </PageSection>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDashboardStore } from '../store/dashboardStore.js'
import { storeToRefs } from 'pinia'
import { PageSection } from '../components/layouts'
import { useIsMobile } from '../composables/useIsMobile.js'
import { useSmetaBreakdown } from '../composables/useSmetaBreakdown.js'
import { SmetaDetails } from '../components/dashboard'

const route = useRoute()
const router = useRouter()
const store = useDashboardStore()
const { selectedSmeta } = storeToRefs(store)
const { isMobile } = useIsMobile()

// Ключ сметы из URL или store
const smetaKey = computed(() => route.params.smetaKey || selectedSmeta.value || 'leto')

// Бизнес-логика вынесена в composable
const { loading, filteredRows, smetaLabel } = useSmetaBreakdown(smetaKey)

// Сортировка
const sortKey = ref('plan')
const sortDir = ref(-1)

onMounted(async () => {
  store.setSelectedSmeta(smetaKey.value)
  await store.fetchSmetaDetails(smetaKey.value)
})

function openByDescription(row) {
  store.setSelectedDescription(row.title || row.description)
  router.push({ path: '/daily' })
}
</script>

<style scoped>
/* Header layout (applies for compact and mobile views) --------------------------------- */
/* Show the two-line mobile title block and hide the long H2 title to enforce consistent layout */
.panel-title-mobile,
.panel-header-controls {
  font-family: var(--font-sans);
}

.panel-title-mobile { display: flex; flex-direction: column; gap: 4px; width: 100%; }
.panel-title { display: none; }

.panel-title-mobile-main { 
  font-family: var(--font-din);
  font-size: var(--font-size-h3); 
  line-height: 1.12; 
  font-weight: 700; 
  color: var(--text-main); 
  margin: 0;
  letter-spacing: -0.02em;
}
.panel-note-mobile { 
  font-size: var(--font-size-sm, 0.875rem); 
  color: var(--text-muted); 
  margin: 0;
}

/* Ensure mobile sort control uses DayPicker-style spacing */
.panel-header-controls .month-select { display:flex; flex-direction:column; gap:4px; }
.panel-header-controls .work-mobile-sort-control select { font-family: var(--font-sans); }

/* Force header grid for smeta details so changes are visible at all widths */
.work-panel-header {
  display: grid;
  grid-template-columns: 1fr minmax(140px, 36%);
  gap: 12px 18px;
  align-items: center;
  padding: 8px 12px;
}

/* Small screens: stack if needed */
@media (max-width: 520px) {
  .work-panel-header { grid-template-columns: 1fr; }
  .panel-header-controls { justify-self: start; }
}

/* Make the smeta breakdown table scroll and fit inside mobile modal/viewports */
.smeta-breakdown-scroll { 
  width: 100%; 
  transition: opacity 200ms ease, filter 200ms ease;
}

.smeta-breakdown-scroll.is-loading {
  opacity: 0.7;
  filter: saturate(0.85);
  pointer-events: none;
}

@media (max-width: 640px) {
  .smeta-breakdown-scroll.is-mobile {
    max-height: calc(100vh - 140px); /* reserve space for header/modal chrome */
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    padding-right: 6px; /* give slight room for scrollbar */
  }

  .smeta-breakdown-scroll.is-mobile { overflow-x: auto; }

  .smeta-breakdown-table {
    width: 100%;
    max-width: 100%;
    table-layout: fixed; /* make columns respect available width */
    border-collapse: collapse;
    box-sizing: border-box;
  }

  .smeta-breakdown-table th,
  .smeta-breakdown-table td {
    min-width: 0; /* allow cells to shrink below content width */
    white-space: normal; /* allow wrapping */
    word-break: break-word;
    box-sizing: border-box;
    padding: 10px 8px;
  }

  /* Keep numeric columns compact and right-aligned, but allow wrapping if necessary */
  .smeta-breakdown-table th.numeric,
  .smeta-breakdown-table td.numeric {
    width: 22%;
    text-align: right;
    white-space: nowrap;
  }
}
</style>

