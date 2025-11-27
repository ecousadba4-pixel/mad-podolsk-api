import { createRouter, createWebHistory } from 'vue-router'

const MonthlyDashboard = () => import('../views/MonthlyDashboard.vue')
const DailyDashboard = () => import('../views/DailyDashboard.vue')
const SmetaBreakdown = () => import('../views/SmetaBreakdown.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: MonthlyDashboard },
    { path: '/daily', component: DailyDashboard },
    { path: '/smeta/:smetaKey', component: SmetaBreakdown }
  ],
})

export default router
