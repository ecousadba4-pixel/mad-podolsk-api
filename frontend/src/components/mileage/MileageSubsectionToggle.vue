<script setup lang="ts">
/**
 * MileageSubsectionToggle — слайдер-переключатель между подразделами пробега
 */
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps<{
  modelValue: 'by-date' | 'by-vehicle'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'by-date' | 'by-vehicle'): void
}>()

const byDateBtn = ref<HTMLButtonElement | null>(null)
const byVehicleBtn = ref<HTMLButtonElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)

// Reactive counter incremented on resize to force indicator recalculation
const resizeTick = ref(0)

const indicatorStyle = computed(() => {
  // Reference resizeTick so the computed re-evaluates on resize
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  resizeTick.value

  const activeBtn = props.modelValue === 'by-date' ? byDateBtn.value : byVehicleBtn.value
  const offsetBtn = props.modelValue === 'by-date' ? null : byDateBtn.value
  
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

function selectOption(option: 'by-date' | 'by-vehicle') {
  emit('update:modelValue', option)
}

// Force reactivity update after mount
const mounted = ref(false)
let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await nextTick()
  mounted.value = true

  // Watch track element for size changes (viewport rotation, responsive breakpoints)
  if (trackRef.value) {
    resizeObserver = new ResizeObserver(() => {
      resizeTick.value++
    })
    resizeObserver.observe(trackRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <div class="subsection-toggle">
    <div ref="trackRef" class="subsection-toggle__track">
      <div 
        v-if="mounted"
        class="subsection-toggle__indicator" 
        :style="indicatorStyle"
      />
      <button
        ref="byDateBtn"
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'by-date' }"
        @click="selectOption('by-date')"
      >
        По дате
      </button>
      <button
        ref="byVehicleBtn"
        type="button"
        class="subsection-toggle__option"
        :class="{ 'subsection-toggle__option--active': modelValue === 'by-vehicle' }"
        @click="selectOption('by-vehicle')"
      >
        По машине
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
  background: #fff;
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-lg);
  padding: 4px;
  box-shadow: var(--shadow-soft);
}

@media (max-width: 768px) {
  .subsection-toggle {
    display: flex;
    width: calc(100% + 2 * var(--gap-md));
    margin-left: calc(-1 * var(--gap-md));
    margin-right: calc(-1 * var(--gap-md));
  }

  .subsection-toggle__track {
    width: 100%;
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  .subsection-toggle__option {
    flex: 1;
    text-align: center;
    padding-left: var(--gap-sm);
    padding-right: var(--gap-sm);
  }
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
