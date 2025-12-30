import { createRouter, createWebHistory } from 'vue-router'

// Lazy load views with webpack magic comments for better chunk naming
const MonthlyDashboard = () => import(/* webpackChunkName: "monthly" */ '../views/MonthlyDashboard.vue')
const DailyDashboard = () => import(/* webpackChunkName: "daily" */ '../views/DailyDashboard.vue')
const SmetaBreakdown = () => import(/* webpackChunkName: "smeta" */ '../views/SmetaBreakdown.vue')

/** @type {import('vue-router').RouteRecordRaw[]} */
const routes = [
  { 
    path: '/', 
    name: 'monthly',
    component: MonthlyDashboard,
    meta: { title: 'Месячный дашборд' }
  },
  { 
    path: '/daily', 
    name: 'daily',
    component: DailyDashboard,
    meta: { title: 'Дневной дашборд' }
  },
  { 
    path: '/smeta/:smetaKey', 
    name: 'smeta-breakdown',
    component: SmetaBreakdown,
    props: true, // автоматически передаёт params как props
    meta: { title: 'Расшифровка сметы' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Scroll behavior для SPA навигации
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0, behavior: 'smooth' }
  }
})

// Обновление заголовка страницы
router.beforeEach((to) => {
  const baseTitle = 'СКПДИ · МАД · Подольск'
  document.title = to.meta.title ? `${to.meta.title} | ${baseTitle}` : baseTitle
})

export default router
