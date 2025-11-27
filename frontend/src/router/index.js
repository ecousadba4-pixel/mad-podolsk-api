import { createRouter, createWebHistory } from 'vue-router'

const MonthlyDashboard = () => import('../views/MonthlyDashboard.vue')
const DailyDashboard = () => import('../views/DailyDashboard.vue')
const SmetaBreakdown = () => import('../views/SmetaBreakdown.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'monthly', component: MonthlyDashboard },
    { path: '/daily', name: 'daily', component: DailyDashboard },
    { path: '/smeta/:smetaKey?', name: 'smeta', component: SmetaBreakdown },
  ],
})

export default router
