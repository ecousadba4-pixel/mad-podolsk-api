<script setup lang="ts">
/**
 * SubsectionToggle — слайдер-переключатель между подразделами
 */
import { ref, computed, onMounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: 'summary' | 'data-entry'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'summary' | 'data-entry'): void
}>()

const summaryBtn = ref<HTMLButtonElement | null>(null)
const dataEntryBtn = ref<HTMLButtonElement | null>(null)

const indicatorStyle = computed(() => {
  const activeBtn = props.modelValue === 'summary' ? summaryBtn.value : dataEntryBtn.value
  const offsetBtn = props.modelValue === 'summary' ? null : summaryBtn.value
  
  if (!activeBtn) {
    return { width: '0px', transform: 'translateX(0)' }
  }
  
  const width = activeBtn.offsetWidth
  const offsetX = offsetBtn ? offsetBtn.offsetWidth : 0
  
  return {
    width: `${width}px`,
    transform: `translateX(${offsetX}px)`
  }
})

function selectOption(option: 'summary' | 'data-entry') {
  emit('update:modelValue', option)
}

// Force reactivity update after mount
const mounted = ref(false)
onMounted(async () => {
  await nextTick()
  mounted.value = true
})
</script>

<template>
  <div class="subsection-toggle">
    <div class="subsection-toggle__track">
      <div 
        v-if="mounted"
        class="subsection-toggle__indicator" 
        :style="indicatorStyle"
      />
      <button
        ref="summaryBtn"
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'summary' }"
        @click="selectOption('summary')"
      >
        Сводка
      </button>
      <button
        ref="dataEntryBtn"
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'data-entry' }"
        @click="selectOption('data-entry')"
      >
        Внесение данных
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.subsection-toggle {
  display: inline-flex;
}

.subsection-toggle__track {
  position: relative;
  display: flex;
  background: var(--bg-muted);
  border-radius: var(--radius-lg);
  padding: 4px;
}

.subsection-toggle__indicator {
  position: absolute;
  top: 4px;
  left: 4px;
  height: calc(100% - 8px);
  background: var(--accent);
  border-radius: var(--radius-md);
  box-shadow: 0 2px 8px rgb(47 111 237 / 35%);
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.subsection-toggle__option {
  position: relative;
  z-index: 1;
  padding: var(--gap-sm) var(--gap-lg);
  border: none;
  background: transparent;
  cursor: pointer;
  font-family: var(--font-sans);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  color: var(--text-muted);
  transition: color 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: var(--text-main);
  }

  &--active {
    color: #fff;
    font-weight: 600;
  }
}
</style>
