# Централизованная обработка ошибок

## Обзор

Система предоставляет единый подход к обработке ошибок и уведомлениям пользователя:

1. **Toast-уведомления** — глобальные всплывающие сообщения
2. **ErrorBoundary** — компонент для изоляции ошибок в UI
3. **EmptyState** — унифицированные пустые состояния
4. **Интеграция с useQuery** — автоматические toast при ошибках API

## Использование

### Toast-уведомления

```typescript
import { useToast } from '@/composables'

const { success, error, warning, info } = useToast()

// Показать уведомление
success('Данные сохранены')
error('Не удалось загрузить данные')
warning('Соединение нестабильно')
info('Доступно обновление')

// С опциями
error('Ошибка сети', {
  duration: 8000,
  action: {
    label: 'Повторить',
    handler: () => window.location.reload()
  }
})
```

### ErrorBoundary

```vue
<template>
  <ErrorBoundary @retry="handleRetry">
    <MyComponent />
  </ErrorBoundary>
</template>

<!-- С кастомным fallback -->
<ErrorBoundary>
  <template #fallback="{ error, retry }">
    <div>Ошибка: {{ error.error.message }}</div>
    <button @click="retry">Повторить</button>
  </template>
  <MyComponent />
</ErrorBoundary>
```

### EmptyState

```vue
<template>
  <!-- Варианты: default, search, filter, error, offline -->
  <EmptyState 
    variant="search"
    title="Ничего не найдено"
    description="Попробуйте другой запрос"
    action-label="Сбросить фильтры"
    @action="resetFilters"
  />
</template>
```

### Ручная обработка ошибок

```typescript
import { handleError } from '@/composables'

try {
  await someAsyncOperation()
} catch (err) {
  handleError(err, {
    showToast: true,           // показать toast
    logToConsole: true,        // логировать в консоль
    userMessage: 'Пользовательское сообщение',
    silent: false              // если true, не показывать ничего
  })
}
```

### useQuery с обработкой ошибок

```typescript
const { data, error } = useQuery({
  queryKey: ['my-data'],
  queryFn: fetchData,
  showErrorToast: true,  // true по умолчанию
  onError: (err) => {
    // Кастомная логика при ошибке
  }
})
```

## Структура файлов

```
src/
├── composables/
│   ├── useToast.ts         # Toast-система
│   └── useErrorHandler.ts  # Обработчик ошибок
├── components/common/
│   ├── ToastContainer.vue  # Контейнер для toast
│   ├── ErrorBoundary.vue   # Error boundary компонент
│   └── EmptyState.vue      # Пустые состояния
```

## API

### useToast()

| Метод | Описание |
|-------|----------|
| `show(message, options)` | Показать toast любого типа |
| `success(message)` | Зелёный toast успеха |
| `error(message)` | Красный toast ошибки |
| `warning(message)` | Жёлтый toast предупреждения |
| `info(message)` | Синий toast информации |
| `dismiss(id)` | Скрыть конкретный toast |
| `dismissAll()` | Скрыть все toast |

### handleError()

| Опция | Тип | Описание |
|-------|-----|----------|
| `showToast` | `boolean` | Показывать toast (default: `true`) |
| `logToConsole` | `boolean` | Логировать в консоль (default: `true`) |
| `userMessage` | `string` | Кастомное сообщение |
| `silent` | `boolean` | Не показывать ничего (default: `false`) |

### EmptyState variants

| Вариант | Описание |
|---------|----------|
| `default` | Нет данных |
| `search` | Ничего не найдено |
| `filter` | Нет результатов по фильтрам |
| `error` | Ошибка загрузки |
| `offline` | Нет подключения |
