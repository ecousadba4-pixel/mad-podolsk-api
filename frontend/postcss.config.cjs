const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');

// Support both CommonJS and ES default export shapes for PurgeCSS plugin
let purgecssPlugin;
try {
  const p = require('@fullhuman/postcss-purgecss');
  purgecssPlugin = p && (p.default || p);
} catch (e) {
  purgecssPlugin = null;
}

module.exports = {
  plugins: [
    autoprefixer,
    // PurgeCSS via PostCSS to remove unused selectors in production builds
    ...(process.env.NODE_ENV === 'production' && purgecssPlugin ? [
      purgecssPlugin({
        content: ['./index.html', './src/**/*.vue', './src/**/*.js'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
        // Safelist: защищаем только необходимые динамические классы
        safelist: [
          // Vue transition классы
          /-(enter|leave)(-(active|to|from))?$/,
          // Динамические состояния
          'is-loading',
          'is-selected',
          'is-mobile',
          'is-collapsed',
          // Классы из :class биндингов
          'negative',
          'delta-negative',
          'overflow',
          'active',
          'disabled',
          'hidden',
          'current-month',
          // Темы
          'theme-dark',
          /^\[data-theme/,
          // Анимации
          /^fade-/,
          /^slide-/,
          // Скелетоны и прогресс
          /skeleton/,
          /progress/
        ]
      })
    ] : []),
    cssnano({ preset: 'default' })
  ]
}
