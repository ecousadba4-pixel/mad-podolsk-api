<script setup>
import AppHeader from './components/AppHeader.vue'
import { useDashboardStore } from './store/dashboardStore.js'
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const store = useDashboardStore()
const router = useRouter()
const routerShell = ref(null)

function fixHeight(h) {
  if (!routerShell.value) return
  routerShell.value.style.height = h + 'px'
  routerShell.value.style.overflow = 'hidden'
}

function clearHeight() {
  if (!routerShell.value) return
  routerShell.value.style.height = 'auto'
  routerShell.value.style.overflow = ''
  routerShell.value.style.transition = ''
}

function beforeEnter(el) {
  if (!routerShell.value) return
  const h = routerShell.value.getBoundingClientRect().height
  fixHeight(h)
}

function enter(el, done) {
  nextTick(() => {
    if (!routerShell.value) { done(); return }
    const newH = el.getBoundingClientRect().height
    routerShell.value.style.transition = 'height 220ms ease'
    // force reflow
    void routerShell.value.offsetHeight
    routerShell.value.style.height = newH + 'px'
    setTimeout(() => {
      clearHeight()
      done()
    }, 240)
  })
}

function afterEnter() { clearHeight() }
</script>

<template>
  <div class="page" :data-view-mode="store.mode">
    <AppHeader />

    <main class="app-content page__content">
      <div ref="routerShell" class="router-shell">
        <RouterView v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in" @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<!-- styles moved to `src/styles/layout.css` -->
