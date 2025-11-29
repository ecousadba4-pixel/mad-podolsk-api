# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

Integration with backend
------------------------

By default the frontend sends requests to the production backend at `https://api.podolsk.mad.moclean.ru`, regardless of which domain serves the SPA. If you need to hit another host (e.g. local backend while the UI is served from a different domain), control the base URL via the environment variable `VITE_API_BASE`. A default `.env` is provided in the `frontend/` folder with `VITE_API_BASE` set to the live backend host. To override it locally (for development) export the variable before running `npm run dev`:

```bash
# run dev against local backend
export VITE_API_BASE="http://localhost:8000"
npm run dev
```

## Стили и дизайн-система

- Все CSS-переменные (tokens) находятся в `src/styles/_tokens.scss` (единственный источник правды). Импорт этих токенов производится первым в `src/styles/main.scss` — используйте переменные оттуда для цветов, отступов и размеров.
- Утилитарные классы в `src/styles/utilities.css` — предпочитайте их вместо inline-стилей.
-
-### Быстрый список утилит
-
- - `p-sm`, `p-md`, `p-lg` — отступы внутри элементов (padding).
- - `m-sm`, `m-md` — внешние отступы (margin).
- - `control`, `control-sm` — высота/размер контролов (используют `--control-height`).
- - `items-center`, `justify-between` — вспомогательные flex-утилиты.
- - `text-h1`, `text-h2`, `text-body` — типографические утилиты, мапятся на токены.
-
-Примеры использования:

- В `AppHeader.vue` мы теперь используем `p-md` и `control` для согласованных отступов и высот контролов.
- В карточках (`SmetaCardsSection.vue`, `SummaryKpiSection.vue`) добавлен `p-md` для унифицированной внутренней заливки.

По мере рефакторинга добавляйте утилиты к шаблонам и постепенно уменьшайте локальные / scoped-правила.

- Общие компоненты и правила размещены в `src/styles/components.css`.

Пример: прогресс‑бар теперь унифицирован. Используйте класс `progress__fill` и передавайте значение ширины через CSS‑переменную `--progress`, например в компоненте:

```html
<div class="progress__bar">
	<div class="progress__fill" :style="{ '--progress': value + '%' }"></div>
</div>
```

Это уменьшает дублирование правил и упрощает изменение внешнего вида прогресс‑баров централизованно.


All frontend API calls use the `/api/dashboard/...` paths and rely on the backend routes implemented in `app/backend`.

If the backend is already deployed and `DB_DSN` is configured in the backend environment, the frontend will show live numbers from that backend host.
