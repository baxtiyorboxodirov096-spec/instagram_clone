import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import http from '@/api/http'
import { connectSocket, disconnectSocket } from '@/api/socket'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)

  const isAuthenticated = computed(() => !!token.value)

  function setSession(data) {
    token.value = data.token
    user.value = data.user
    localStorage.setItem('token', data.token)
    connectSocket(data.token)
  }

  async function register(payload) {
    const { data } = await http.post('/auth/register', payload)
    setSession(data)
  }

  async function login(payload) {
    const { data } = await http.post('/auth/login', payload)
    setSession(data)
  }

  // Восстановление сессии после перезагрузки страницы
  async function fetchMe() {
    if (!token.value) return
    try {
      const { data } = await http.get('/auth/me')
      user.value = data.user
      connectSocket(token.value)
    } catch {
      logout()
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    disconnectSocket()
  }

  return { token, user, isAuthenticated, register, login, fetchMe, logout }
})
