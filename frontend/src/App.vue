<script setup>
import { AppHeader } from './components/layouts'
import { useDashboardStore } from './store/dashboardStore.js'
import { shallowRef, nextTick, onErrorCaptured } from 'vue'
import { storeToRefs } from 'pinia'

const store = useDashboardStore()
const { mode } = storeToRefs(store)

// shallowRef для DOM элемента - не нужна глубокая реактивность
const routerShell = shallowRef(null)

// Error boundary для дочерних компонентов
onErrorCaptured((err, instance, info) => {
  console.error('Error captured in App:', err, info)
  // Возвращаем false чтобы ошибка не всплывала дальше
  return false
})

function fixHeight(h) {
  if (!routerShell.value) return
  routerShell.value.style.height = `${h}px`
  routerShell.value.style.overflow = 'hidden'
}

function clearHeight() {
  if (!routerShell.value) return
  Object.assign(routerShell.value.style, {
    height: 'auto',
    overflow: '',
    transition: ''
  })
}

function beforeEnter() {
  if (!routerShell.value) return
  const h = routerShell.value.getBoundingClientRect().height
  fixHeight(h)
}

function enter(el, done) {
  nextTick(() => {
    if (!routerShell.value) { 
      done()
      return 
    }
    const newH = el.getBoundingClientRect().height
    routerShell.value.style.transition = 'height 220ms ease'
    // Force reflow для анимации
    void routerShell.value.offsetHeight
    routerShell.value.style.height = `${newH}px`
    
    // Используем событие transitionend вместо setTimeout
    const onEnd = () => {
      routerShell.value?.removeEventListener('transitionend', onEnd)
      clearHeight()
      done()
    }
    routerShell.value.addEventListener('transitionend', onEnd, { once: true })
    
    // Fallback на случай если transition не сработает
    setTimeout(() => {
      clearHeight()
      done()
    }, 250)
  })
}

function afterEnter() { 
  clearHeight() 
}
</script>

<template>
  <div class="page" :data-view-mode="mode">
    <AppHeader />

    <main class="app-content page__content">
      <div ref="routerShell" class="router-shell">
        <RouterView v-slot="{ Component }">
          <Suspense>
            <template #default>
              <Transition 
                name="fade-slide" 
                mode="out-in" 
                @before-enter="beforeEnter" 
                @enter="enter" 
                @after-enter="afterEnter"
              >
                <KeepAlive :max="3">
                  <component :is="Component" />
                </KeepAlive>
              </Transition>
            </template>
            <template #fallback>
              <div class="router-fallback">Загрузка экрана…</div>
            </template>
          </Suspense>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<!-- styles moved to `src/styles/layout.css` -->
