import { createApp, type ComponentPublicInstance } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { usePreferredTheme, installQueryClient } from './composables'

// глобальные стили (объединены и структурированы в layers: tokens->foundations->components->overrides)
import './styles/main.scss'

// Синхронизация темы вынесена в composable, чтобы можно было переиспользовать
// её в других местах (например, в настройках профиля).
usePreferredTheme()

// Debug helpers: show runtime errors on the page to help diagnose blank screen
// ТОЛЬКО для development - в production отключено для лучшего UX
function showRuntimeError(message: string): void {
  // Не показываем overlay в production
  if (import.meta.env.PROD) return
  
  try {
    const id = '__runtime_error_overlay__'
    let el = document.getElementById(id)
    if (!el) {
      el = document.createElement('div')
      el.id = id
      Object.assign(el.style, {
        position: 'fixed',
        left: '12px',
        right: '12px',
        top: '12px',
        padding: '12px 16px',
        background: 'rgba(255,240,240,0.98)',
        color: '#800',
        border: '2px solid #f99',
        zIndex: '99999',
        fontSize: '13px',
        fontFamily: 'monospace',
        whiteSpace: 'pre-wrap'
      })
      document.body?.appendChild(el)
    }
    el.textContent = message
  } catch (e) {
    console.error('showRuntimeError failed', e)
  }
}

// Глобальные слушатели ошибок: в dev показываем overlay, в prod только логируем
window.addEventListener('error', (ev: ErrorEvent) => {
  const msg = 'Error: ' + (ev.error?.stack ? ev.error.stack : ev.message || ev.toString())
  console.error(msg)
  if (import.meta.env.DEV) {
    showRuntimeError(msg)
  }
})

window.addEventListener('unhandledrejection', (ev: PromiseRejectionEvent) => {
  const reason = ev.reason?.stack ? ev.reason.stack : String(ev.reason)
  const msg = 'UnhandledRejection: ' + reason
  console.error(msg)
  if (import.meta.env.DEV) {
    showRuntimeError(msg)
  }
})

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
installQueryClient(app, {
  staleTime: 5 * 60 * 1000,
  retry: 2,
  retryDelay: (attempt: number) => 600 * (attempt + 1),
  refetchOnWindowFocus: true
})

// Import auth store after pinia is installed
import { useAuthStore } from './store/authStore'
// Initialize UI store early so feature stores can access selectedMonth
import { useDashboardUiStore } from './store/dashboardUiStore'

// Auth guard
router.beforeEach(async (to, _from, next) => {
  const authStore = useAuthStore()
  
  // Initialize auth state if not done yet
  if (authStore.user === null && to.path !== '/login') {
    await authStore.init()
  }
  
  // Check if route requires auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }
  
  // Check if route requires admin
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    next('/')
    return
  }
  
  // Redirect to home if already authenticated and trying to access login
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

// Vue 3.4+: улучшенная производительность гидратации
// Performance: отключаем devtools в production
if (import.meta.env.PROD) {
  app.config.performance = false
}

// Global error handler для production
app.config.errorHandler = (err: unknown, _instance: ComponentPublicInstance | null, info: string) => {
  console.error('Vue error:', err, info)
  if (import.meta.env.DEV) {
    const message = err instanceof Error ? err.message : String(err)
    showRuntimeError(`Vue Error [${info}]: ${message}`)
  }
}

app.mount('#app')
