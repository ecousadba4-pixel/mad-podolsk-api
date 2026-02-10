/**
 * Composable для debounced-поиска с минимальной длиной ввода
 * 
 * Используется в PricesView, RoadSectionsView и других разделах с фильтрацией.
 * Автоматически вызывает fetchFn при изменении query с задержкой.
 */

import { ref, watch, type Ref } from 'vue'

export interface UseDebouncedSearchOptions {
  /** Задержка перед вызовом fetchFn (мс) */
  delay?: number
  /** Минимальное количество символов для запуска поиска */
  minLength?: number
}

export interface UseDebouncedSearchReturn {
  query: Ref<string>
}

export function useDebouncedSearch(
  fetchFn: () => void,
  options: UseDebouncedSearchOptions = {}
): UseDebouncedSearchReturn {
  const { delay = 300, minLength = 3 } = options

  const query = ref('')
  let timeout: ReturnType<typeof setTimeout> | null = null

  watch(query, (val) => {
    if (timeout) clearTimeout(timeout)
    const trimmed = val.trim()
    if (trimmed.length >= minLength || trimmed.length === 0) {
      timeout = setTimeout(fetchFn, delay)
    }
  })

  return { query }
}
