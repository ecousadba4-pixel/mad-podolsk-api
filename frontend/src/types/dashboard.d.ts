/**
 * Типы данных для Dashboard API и компонентов
 */

/** Данные контракта */
export interface ContractData {
  summa_contract: number | null
  fact_total: number | null
  contract_planfact_pct: number | null
}

/** KPI показатели */
export interface KpiData {
  plan_total: number | null
  fact_total: number | null
  delta: number | null
  avg_daily_revenue: number | null
}

/** Сводка по месяцу */
export interface MonthlySummary {
  month: string
  contract: ContractData
  kpi: KpiData
  loaded_at?: string
  last_updated?: string
  updated_at?: string
}

/** Карточка сметы */
export interface SmetaCard {
  smeta_key: string
  label: string
  plan: number
  fact: number
  delta: number
  progressPercent: number
  count?: number
}

/** Детализация сметы */
export interface SmetaDetailRow {
  title: string
  description?: string
  description_id?: string
  work_name?: string
  plan: number
  fact: number
  delta: number
  progressPercent: number
  type_of_work?: string | null
}

/** Строка дневных данных */
export interface DailyRow {
  id?: string
  date: string
  name: string
  unit: string
  volume: string
  amount: number
}

/** Результат дневного запроса */
export interface DailyData {
  rows: DailyRow[]
  total: number
  date: string
}

/** Режим отображения дашборда */
export type DashboardMode = 'monthly' | 'daily'

/** Ключ сортировки для таблицы сметы */
export type SmetaSortKey = 'plan' | 'fact' | 'delta' | 'title'

/** Направление сортировки */
export type SortDirection = 1 | -1

/** API Response wrapper */
export interface ApiResponse<T> {
  data?: T
  error?: string
  status?: number
}

/** Query options для useQuery */
export interface QueryOptions<T> {
  queryKey: string | string[] | (() => string | string[])
  queryFn: () => Promise<T>
  enabled?: boolean | (() => boolean)
  staleTime?: number
  refetchOnWindowFocus?: boolean
  keepPreviousData?: boolean
}

/** Query result */
export interface QueryResult<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isFetching: boolean
  isPreviousData: boolean
  status: 'idle' | 'loading' | 'success' | 'error' | 'refetching'
  refetch: () => Promise<T>
}
