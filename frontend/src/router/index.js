import { createRouter, createWebHistory } from 'vue-router'

import MonthlyDashboard from '../views/MonthlyDashboard.vue'
import DailyDashboard from '../views/DailyDashboard.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: MonthlyDashboard },
    { path: '/daily', component: DailyDashboard }
  ],
})

export default router
