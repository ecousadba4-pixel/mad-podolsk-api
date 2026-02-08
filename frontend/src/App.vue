<script setup lang="ts">
import { AppHeader } from './components/layouts'
import { ToastContainer, ErrorBoundary } from './components/common'
import { useDashboardUiStore } from './store/dashboardUiStore'
import { shallowRef, nextTick, onErrorCaptured, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { provideToast, handleError } from './composables'

const uiStore = useDashboardUiStore()
const { mode } = storeToRefs(uiStore)
const route = useRoute()

// Не показываем хедер на странице логина
const showHeader = computed(() => route.path !== '/login')

// Инициализируем провайдер toast для всего приложения
provideToast()

// shallowRef для DOM элемента - не нужна глубокая реактивность
const routerShell = shallowRef(null)

// Централизованная обработка ошибок Vue-компонентов
onErrorCaptured((err, instance, info) => {
  handleError(err, {
    showToast: true,
    logToConsole: true,
    userMessage: 'Произошла ошибка в приложении'
  })
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
    <AppHeader v-if="showHeader" />

    <main class="app-content page__content">
      <div ref="routerShell" class="router-shell">
        <RouterView v-slot="{ Component }">
          <ErrorBoundary>
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
          </ErrorBoundary>
        </RouterView>
      </div>
    </main>
    
    <!-- Глобальный контейнер для toast-уведомлений -->
    <ToastContainer />
  </div>
</template>

<!-- styles moved to `src/styles/layout.css` -->
