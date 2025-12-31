# План миграции на UI-Kit

Этот документ описывает постепенный переход от CSS-utility классов к компонентам UI-kit.

## Приоритеты миграции

### 🔴 Высокий приоритет (новый код)

Для **нового кода** всегда используйте UI-kit компоненты:

| Вместо CSS-класса | Используйте компонент |
|-------------------|----------------------|
| `.text-h1`, `.text-h2`, `.text-body`, etc. | `<UiText variant="h1">` |
| `.text-label`, `.label-style` | `<UiLabel>` |
| `.skeleton`, `.skeleton-line`, `.skeleton-card` | `<UiSkeleton type="...">` |
| `.card`, `.card--interactive` | `<UiCard variant="...">` |
| `.pill` (простые метки) | `<UiBadge>` |
| `.btn` (интерактивные) | `<UiButton>` |
| `progress-bar`, `progress__fill` | `<UiProgress>` |

### 🟡 Средний приоритет (рефакторинг)

Постепенно мигрируйте существующие компоненты:

1. **Типографика** — заменить `class="text-h3"` на `<UiText variant="h3">`
2. **Скелетоны** — заменить `.skeleton` разметку на `<UiSkeleton>`
3. **Кнопки** — заменить `.btn` на `<UiButton>`

### 🟢 Низкий приоритет (оставить как есть)

Доменные стили **не трогаем** — они специфичны для бизнес-логики:

- `.smeta-card__*` — стили смет-карточек
- `.summary-*` — стили сводных секций
- `.category-*` — стили категорий
- `.contract-*` — стили контрактов
- `.daily-*` — стили таблиц "по дням"

## Примеры миграции

### До (CSS-классы)

```vue
<template>
  <div class="card">
    <h3 class="text-h3">Заголовок</h3>
    <span class="text-label">Метка</span>
    <p class="text-body muted">Описание</p>
    <div class="progress-bar">
      <div class="progress__fill" :style="{ '--progress': '75%' }"></div>
    </div>
  </div>
</template>
```

### После (UI-kit)

```vue
<script setup>
import { UiCard, UiText, UiLabel, UiProgress, UiStack } from '@/components/ui'
</script>

<template>
  <UiCard>
    <UiStack gap="sm">
      <UiText variant="h3">Заголовок</UiText>
      <UiLabel>Метка</UiLabel>
      <UiText variant="body" color="muted">Описание</UiText>
      <UiProgress :value="75" />
    </UiStack>
  </UiCard>
</template>
```

## Файлы с @deprecated

Следующие SCSS-модули содержат deprecated классы:

- `_utilities.scss` — `.text-*`, `.skeleton*`
- `_buttons-pills.scss` — `.pill`, `.btn`
- `_cards.scss` — `.card`, `.progress-*`

## Статус миграции

| Компонент | CSS-классы | UI-kit | Мигрировано |
|-----------|------------|--------|-------------|
| LastUpdatedBadge | `.text-label`, `.text-body` | UiLabel, UiText | ✅ |
| SmetaCardsSection | `.text-h3`, `.text-label`, `.text-body`, `.progress-*` | UiText, UiLabel, UiBadge, UiProgress | ✅ |
| MobileDailyFull | `.text-h3`, `.text-label`, `.text-body` | UiText, UiLabel | ✅ |
| DailyTable | `.text-h3` | UiText | ✅ |
| SmetaDetailsMobile | `.text-label`, `.text-body` | UiText, UiLabel | ✅ |
| SummaryKpiSection | `.progress-bar`, `.progress__fill` | UiLabel, UiText, UiProgress | ✅ |
| ContractExecutionSection | `.progress__fill` | UiText, UiLabel, UiProgress | ✅ |

---

**Примечание:** Миграция выполняется постепенно. Старые классы продолжают работать.
