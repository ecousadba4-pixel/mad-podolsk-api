# UI Kit — Библиотека компонентов

Мини-библиотека базовых UI-компонентов, построенная на основе дизайн-токенов проекта.

## Установка

Компоненты экспортируются из `@/components/ui`:

```vue
<script setup>
import { UiButton, UiCard, UiProgress, UiBadge } from '@/components/ui'
</script>
```

## Токены

Все компоненты используют CSS custom properties из `src/styles/_tokens.scss`:

| Категория | Примеры токенов |
|-----------|-----------------|
| **Цвета** | `--text-main`, `--accent`, `--success`, `--danger` |
| **Поверхности** | `--bg-card`, `--surface-base`, `--overlay-*` |
| **Границы** | `--border-soft`, `--border-strong` |
| **Типографика** | `--font-size-h1`, `--font-size-body`, `--font-size-caption` |
| **Отступы** | `--gap-xs`, `--gap-sm`, `--gap-md`, `--gap-lg`, `--gap-xl` |
| **Радиусы** | `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl` |
| **Тени** | `--shadow-card`, `--shadow-soft`, `--shadow-strong` |
| **Контролы** | `--control-height`, `--control-height-sm` |

## Компоненты

### UiButton

Базовая кнопка с вариантами оформления.

```vue
<UiButton variant="primary" size="md">Сохранить</UiButton>
<UiButton variant="secondary">Отмена</UiButton>
<UiButton variant="ghost" icon><Close /></UiButton>
<UiButton variant="danger" :loading="isLoading">Удалить</UiButton>
```

**Props:**
- `variant`: `'primary'` | `'secondary'` | `'ghost'` | `'danger'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `disabled`: boolean
- `loading`: boolean
- `fullWidth`: boolean
- `icon`: boolean — квадратная кнопка для иконок

---

### UiCard

Карточка-контейнер.

```vue
<UiCard variant="elevated" padding="lg">
  <template #header>Заголовок</template>
  Контент карточки
  <template #footer>Футер</template>
</UiCard>

<UiCard variant="interactive" @click="handleClick">
  Кликабельная карточка
</UiCard>
```

**Props:**
- `variant`: `'default'` | `'elevated'` | `'flat'` | `'interactive'`
- `padding`: `'none'` | `'sm'` | `'md'` | `'lg'`
- `rounded`: boolean — увеличенный border-radius
- `tag`: HTML-тег (`'div'`, `'article'`, `'section'`)

---

### UiProgress

Прогресс-бар.

```vue
<UiProgress :value="75" color="accent" />
<UiProgress :value="120" :max="100" color="success" show-label />
<UiProgress 
  :value="45" 
  :labels="{ left: 'Выполнено', right: '45%' }"
/>
```

**Props:**
- `value`: number (required)
- `max`: number (default: 100)
- `color`: `'accent'` | `'success'` | `'danger'`
- `size`: `'sm'` | `'md'` | `'lg'`
- `showLabel`: boolean
- `labels`: `{ left?: string, right?: string }`
- `animated`: boolean

---

### UiBadge

Бейдж / метка статуса.

```vue
<UiBadge variant="success" dot>Активно</UiBadge>
<UiBadge variant="accent" rounded>Новое</UiBadge>
<UiBadge variant="danger">Ошибка</UiBadge>
```

**Props:**
- `variant`: `'default'` | `'accent'` | `'success'` | `'danger'` | `'muted'`
- `size`: `'sm'` | `'md'`
- `dot`: boolean — точка-индикатор слева
- `rounded`: boolean — pill-форма

---

### UiSkeleton

Заглушка загрузки.

```vue
<UiSkeleton type="line" width="60%" />
<UiSkeleton type="circle" size="48px" />
<UiSkeleton type="card" :lines="4" />
```

**Props:**
- `type`: `'line'` | `'circle'` | `'rect'` | `'card'`
- `width`: string
- `height`: string
- `size`: string (для circle)
- `lines`: number (для card)
- `static`: boolean — отключить анимацию

---

### UiSpinner

Индикатор загрузки.

```vue
<UiSpinner size="md" />
<UiSpinner size="sm" inherit />
```

**Props:**
- `size`: `'sm'` | `'md'` | `'lg'`
- `inherit`: boolean — использовать цвет родителя

---

### UiInput

Текстовое поле.

```vue
<UiInput v-model="search" placeholder="Поиск..." />
<UiInput v-model="email" error :error-message="emailError">
  <template #prefix><SearchIcon /></template>
</UiInput>
```

**Props:**
- `modelValue`: string | number
- `type`: string (default: `'text'`)
- `placeholder`: string
- `size`: `'sm'` | `'md'` | `'lg'`
- `disabled`: boolean
- `error`: boolean
- `errorMessage`: string
- `fullWidth`: boolean

**Slots:** `prefix`, `suffix`

---

### UiText

Типографический компонент.

```vue
<UiText variant="h1">Заголовок</UiText>
<UiText variant="body" color="muted">Описание</UiText>
<UiText variant="label" uppercase tracking>Метка</UiText>
<UiText variant="body-sm" numeric>123 456</UiText>
```

**Props:**
- `variant`: `'h1'` | `'h2'` | `'h3'` | `'body'` | `'body-sm'` | `'caption'` | `'label'` | `'tiny'`
- `color`: `'main'` | `'subtle'` | `'muted'` | `'soft'` | `'faint'` | `'accent'` | `'success'` | `'danger'` | `'inherit'`
- `weight`: `'normal'` | `'medium'` | `'semibold'` | `'bold'`
- `align`: `'left'` | `'center'` | `'right'`
- `uppercase`: boolean
- `tracking`: boolean — letter-spacing
- `truncate`: boolean
- `numeric`: boolean — tabular-nums

---

### UiLabel

Подпись / метка.

```vue
<UiLabel>План</UiLabel>
<UiLabel color="accent" for="input-id">Email</UiLabel>
```

**Props:**
- `color`: `'muted'` | `'soft'` | `'faint'` | `'accent'` | `'main'`
- `for`: string — для связи с input

---

### UiStack

Flex-контейнер для укладки элементов.

```vue
<UiStack direction="row" gap="md" align="center">
  <UiBadge>Tag 1</UiBadge>
  <UiBadge>Tag 2</UiBadge>
</UiStack>

<UiStack gap="lg" justify="between" full-width>
  <div>Left</div>
  <div>Right</div>
</UiStack>
```

**Props:**
- `direction`: `'row'` | `'column'`
- `gap`: `'none'` | `'xs'` | `'sm'` | `'md'` | `'lg'` | `'xl'`
- `align`: `'start'` | `'center'` | `'end'` | `'stretch'` | `'baseline'`
- `justify`: `'start'` | `'center'` | `'end'` | `'between'` | `'around'` | `'evenly'`
- `wrap`: boolean
- `fullWidth`: boolean

---

## Иконки

Иконки реэкспортируются из `@/components/common/Icons.vue`:

```vue
<script setup>
import { ChevronDown, Calendar, Close, Check } from '@/components/ui'
</script>

<template>
  <ChevronDown :size="16" />
  <Calendar :size="20" />
</template>
```

Доступные иконки:
- `ChevronLeft`, `ChevronRight`, `ChevronDown`, `ChevronUp`
- `Calendar`, `Close`, `Check`

---

## Тёмная тема

Все компоненты автоматически поддерживают тёмную тему через CSS-переменные.
Тема активируется:

1. Атрибутом: `<html data-theme="dark">`
2. Классом: `<html class="theme-dark">`
3. Автоматически по `prefers-color-scheme: dark`

---

## Примеры использования

### Карточка с прогрессом

```vue
<UiCard>
  <UiStack gap="md">
    <UiStack direction="row" justify="between" align="center">
      <UiText variant="body" weight="bold">Смета #123</UiText>
      <UiBadge variant="success" dot>Активно</UiBadge>
    </UiStack>
    
    <UiStack gap="xs">
      <UiLabel>Выполнение</UiLabel>
      <UiProgress :value="75" :labels="{ right: '75%' }" />
    </UiStack>
    
    <UiButton variant="secondary" full-width>Подробнее</UiButton>
  </UiStack>
</UiCard>
```

### Форма с валидацией

```vue
<UiStack gap="lg">
  <UiStack gap="xs">
    <UiLabel for="email">Email</UiLabel>
    <UiInput
      id="email"
      v-model="email"
      type="email"
      placeholder="example@mail.com"
      :error="!!emailError"
      :error-message="emailError"
      full-width
    />
  </UiStack>
  
  <UiButton variant="primary" :loading="isSubmitting" full-width>
    Отправить
  </UiButton>
</UiStack>
```
