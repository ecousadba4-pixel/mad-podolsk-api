<script setup lang="ts">
/**
 * UiInput — базовое текстовое поле ввода
 *
 * Поддерживает:
 * - Разные размеры
 * - Состояния ошибки
 * - Иконки слева/справа
 * - Disabled состояние
 */
import { computed, type PropType } from 'vue'

type InputSize = 'sm' | 'md' | 'lg'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  },
  type: {
    type: String,
    default: 'text'
  },
  placeholder: {
    type: String,
    default: ''
  },
  size: {
    type: String as PropType<InputSize>,
    default: 'md'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  fullWidth: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
  (e: 'focus', event: FocusEvent): void
  (e: 'blur', event: FocusEvent): void
}>()

const classes = computed(() => [
  'ui-input',
  `ui-input--${props.size}`,
  {
    'ui-input--error': props.error,
    'ui-input--disabled': props.disabled,
    'ui-input--full-width': props.fullWidth
  }
])

function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div :class="classes">
    <div class="ui-input__wrapper">
      <span v-if="$slots.prefix" class="ui-input__prefix">
        <slot name="prefix" />
      </span>

      <input
        class="ui-input__field"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="handleInput"
        @focus="emit('focus', $event)"
        @blur="emit('blur', $event)"
      />

      <span v-if="$slots.suffix" class="ui-input__suffix">
        <slot name="suffix" />
      </span>
    </div>

    <span v-if="error && errorMessage" class="ui-input__error">
      {{ errorMessage }}
    </span>
  </div>
</template>

<style scoped lang="scss">
.ui-input {
  display: inline-flex;
  flex-direction: column;
  gap: var(--gap-xs);

  &--full-width {
    width: 100%;
  }

  &__wrapper {
    display: flex;
    align-items: center;
    background: var(--bg-card);
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-md);
    transition: var(--transition-border);
    overflow: hidden;

    &:focus-within {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--focus-ring);
    }

    .ui-input--error & {
      border-color: var(--danger);

      &:focus-within {
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--danger) 18%, transparent);
      }
    }

    .ui-input--disabled & {
      background: var(--bg-muted);
      cursor: not-allowed;
    }
  }

  &__field {
    flex: 1;
    border: none;
    background: transparent;
    font-family: var(--font-sans);
    color: var(--text-main);
    outline: none;

    &::placeholder {
      color: var(--text-faint);
    }

    &:disabled {
      cursor: not-allowed;
      color: var(--text-muted);
    }

    /* Sizes */
    .ui-input--sm & {
      height: var(--control-height-mobile);
      padding: 0 var(--gap-sm);
      font-size: var(--font-size-caption);
    }

    .ui-input--md & {
      height: var(--control-height-sm);
      padding: 0 var(--gap-md);
      font-size: var(--font-size-body-sm);
    }

    .ui-input--lg & {
      height: var(--control-height);
      padding: 0 var(--gap-lg);
      font-size: var(--font-size-body);
    }
  }

  &__prefix,
  &__suffix {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;

    .ui-input--sm & { padding: 0 var(--gap-xs); }
    .ui-input--md & { padding: 0 var(--gap-sm); }
    .ui-input--lg & { padding: 0 var(--gap-md); }
  }

  &__prefix { padding-left: var(--gap-sm); }
  &__suffix { padding-right: var(--gap-sm); }

  &__error {
    font-size: var(--font-size-caption);
    color: var(--danger);
  }
}

/* Fallback for color-mix */
@supports not (color-mix(in srgb, red, blue)) {
  .ui-input--error .ui-input__wrapper:focus-within {
    box-shadow: 0 0 0 3px rgb(192 52 43 / 18%);
  }
}
</style>
