import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// глобальные стили (объединены и структурированы в layers: tokens->foundations->components->overrides)
import './styles/main.scss'

// Синхронизация темы: если разработчик не зафиксировал data-theme,
// привязываемся к системным настройкам.
const root = document.documentElement
const media = window.matchMedia('(prefers-color-scheme: dark)')
const applyPreferredTheme = (event) => {
  if (!root || root.dataset.theme) return
  root.dataset.theme = event.matches ? 'dark' : 'light'
}
applyPreferredTheme(media)
media.addEventListener('change', applyPreferredTheme)

// Debug helpers: show runtime errors on the page to help diagnose blank screen
function showRuntimeError(message){
        try{
                const id = '__runtime_error_overlay__'
		let el = document.getElementById(id)
		if (!el){
			el = document.createElement('div')
			el.id = id
			Object.assign(el.style, {
				position: 'fixed', left: 12, right: 12, top: 12, padding: '12px 16px',
				background: 'rgba(255,240,240,0.98)', color: '#800', border: '2px solid #f99',
				zIndex: 99999, fontSize: '13px', fontFamily: 'monospace', whiteSpace: 'pre-wrap'
			})
			document.body && document.body.appendChild(el)
		}
		el.textContent = message
	}catch(e){ console.error('showRuntimeError failed', e) }
}

window.addEventListener('error', (ev)=>{
	const msg = 'Error: ' + (ev.error && ev.error.stack ? ev.error.stack : ev.message || ev.toString())
	console.error(msg)
	showRuntimeError(msg)
})
window.addEventListener('unhandledrejection', (ev)=>{
	const reason = ev.reason && ev.reason.stack ? ev.reason.stack : String(ev.reason)
	const msg = 'UnhandledRejection: ' + reason
	console.error(msg)
	showRuntimeError(msg)
})

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

