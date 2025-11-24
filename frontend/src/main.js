import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// глобальные стили
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/mockup.css'
import './styles/modal.css'
import './styles/print.css'
import './styles/summary.css'
import './styles/tokens.css'
import './styles/utilities.css'
import './styles/work.css'
import './styles/categories.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

