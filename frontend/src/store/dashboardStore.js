// frontend/src/stores/dashboardStore.js
import { defineStore } from 'pinia'

// Моки под дашборд "По месяцам"
// Ты потом просто заменишь их на реальные данные из API

const MOCK_MONTHLY_SUMMARY = {
  month: '2025-11',
  updatedAt: '2025-11-23T12:00:00+03:00',
  contract: {
    summa_contract: 10_000_000,
    fact_total: 4_200_000,
    contract_planfact_pct: 42,
  },
  kpi: {
    plan_total: 5_000_000,
    fact_total: 4_200_000,
    delta: -800_000,
    avg_daily_revenue: 210_000,
  },
}

const MOCK_SMETA_CARDS = [
  {
    key: 'leto',
    title: 'Лето',
    plan: 2_000_000,
    fact: 1_500_000,
    delta: -500_000,
  },
  {
    key: 'zima',
    title: 'Зима',
    plan: 2_500_000,
    fact: 2_200_000,
    delta: -300_000,
  },
  {
    key: 'vnereglement',
    title: 'Внерегламент',
    plan: 500_000,
    fact: 500_000,
    delta: 0,
  },
]

const MOCK_SMETA_DETAILS = [
  // Лето
  {
    smetaKey: 'leto',
    name: 'Подметание дорог',
    plan: 500_000,
    fact: 450_000,
    delta: -50_000,
  },
  {
    smetaKey: 'leto',
    name: 'Полив дорог',
    plan: 300_000,
    fact: 250_000,
    delta: -50_000,
  },
  // Зима
  {
    smetaKey: 'zima',
    name: 'Уборка снега',
    plan: 1_500_000,
    fact: 1_300_000,
    delta: -200_000,
  },
  {
    smetaKey: 'zima',
    name: 'Вывоз снега',
    plan: 1_000_000,
    fact: 900_000,
    delta: -100_000,
  },
  // Внерегламент
  {
    smetaKey: 'vnereglement',
    name: 'Разовые работы',
    plan: 500_000,
    fact: 500_000,
    delta: 0,
  },
]

const MOCK_DAILY_REVENUE = [
  { date: '2025-11-01', amount: 200_000 },
  { date: '2025-11-02', amount: 180_000 },
  { date: '2025-11-03', amount: 220_000 },
  { date: '2025-11-04', amount: 210_000 },
]

const MOCK_DESCRIPTION_DAILY = [
  { date: '2025-11-01', amount: 50_000 },
  { date: '2025-11-02', amount: 40_000 },
  { date: '2025-11-03', amount: 55_000 },
]

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    // Выбранный месяц (по умолчанию текущий)
    selectedMonth: new Date().toISOString().slice(0, 7), // "YYYY-MM"

    // Выбранная смета и вид работ
    selectedSmeta: null, // 'leto' | 'zima' | 'vnereglement' | null
    selectedDescription: null,

    // Данные дашборда
    monthlySummary: null, // контракт + KPI
    smetaCards: [], // карточки Лето/Зима/Внерегламент
    smetaDetails: [], // строки таблицы по сметам
    dailyRevenue: [], // данные для модалки "Выручка по дням"
    descriptionDaily: [], // данные для модалки "Расшифровка работ по дням"

    // UI-состояние
    isLoading: false,
    error: null,

    // Модалки
    isDailyRevenueModalOpen: false,
    isDescriptionDailyModalOpen: false,
  }),

  getters: {
    // Фильтр деталей по выбранной смете
    filteredSmetaDetails(state) {
      if (!state.selectedSmeta) return []
      return state.smetaDetails.filter(
        (row) => row.smetaKey === state.selectedSmeta,
      )
    },

    // Тот же массив, но без поля smetaKey — удобно для таблицы
    tableSmetaDetails(state) {
      return state.filteredSmetaDetails.map((row) => ({
        name: row.name,
        plan: row.plan,
        fact: row.fact,
        delta: row.delta,
      }))
    },
  },

  actions: {
    // Инициализация (можно вызвать в onMounted в MonthlyDashboard)
    initMonthlyDashboard() {
      this.loadMonthlyData()
    },

    setMonth(month) {
      this.selectedMonth = month
      this.loadMonthlyData()
    },

    // Загрузка всех "месячных" данных (пока из моков)
    loadMonthlyData() {
      this.isLoading = true
      this.error = null

      // Здесь пока моки, потом заменишь на запрос к API
      try {
        // Имитация "загрузки"
        this.monthlySummary = { ...MOCK_MONTHLY_SUMMARY, month: this.selectedMonth }
        this.smetaCards = [...MOCK_SMETA_CARDS]
        this.smetaDetails = [...MOCK_SMETA_DETAILS]
      } catch (e) {
        this.error = 'Не удалось загрузить данные дашборда'
      } finally {
        this.isLoading = false
      }
    },

    // Выбор сметы (Лето/Зима/Внерегламент)
    selectSmeta(key) {
      this.selectedSmeta = key
      // В реальном API здесь можно было бы отдельно грузить детали,
      // но для моков они уже в памяти, поэтому ничего не делаем
    },

    // Выбор конкретного вида работ (строка таблицы)
    selectDescription(name) {
      this.selectedDescription = name
    },

    // Модалка "Выручка по дням"
    openDailyRevenueModal() {
      // Сейчас просто берём моки
      this.dailyRevenue = [...MOCK_DAILY_REVENUE]
      this.isDailyRevenueModalOpen = true
    },

    closeDailyRevenueModal() {
      this.isDailyRevenueModalOpen = false
    },

    // Модалка "Расшифровка работ по дням"
    openDescriptionDailyModal() {
      // Сейчас просто моки; позже можно фильтровать по selectedDescription
      this.descriptionDaily = [...MOCK_DESCRIPTION_DAILY]
      this.isDescriptionDailyModalOpen = true
    },

    closeDescriptionDailyModal() {
      this.isDescriptionDailyModalOpen = false
    },
  },
})

