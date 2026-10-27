import './assets/main.css'
import './assets/instagram.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())

// Восстанавливаем сессию до первой навигации
await useAuthStore().fetchMe()

app.use(router)

app.mount('#app')
