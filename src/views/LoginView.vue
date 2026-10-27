<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/api/http'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const form = reactive({ login: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form)
    router.push(route.query.redirect || '/')
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="logo">Instagram</h1>
      <form @submit.prevent="submit">
        <input v-model="form.login" placeholder="Имя пользователя или эл. адрес" required />
        <input v-model="form.password" type="password" placeholder="Пароль" required />
        <button class="btn-primary" :disabled="loading || !form.login || form.password.length < 6">
          {{ loading ? 'Вход…' : 'Войти' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
    <div class="auth-card small">
      У вас ещё нет аккаунта?
      <RouterLink to="/register">Зарегистрироваться</RouterLink>
    </div>
  </div>
</template>
