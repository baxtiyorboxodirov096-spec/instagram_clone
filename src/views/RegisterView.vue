<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/api/http'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ email: '', fullName: '', username: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.register(form)
    router.push('/')
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
      <p class="subtitle">Зарегистрируйтесь, чтобы общаться с друзьями.</p>
      <form @submit.prevent="submit">
        <input v-model="form.email" type="email" placeholder="Эл. адрес" required />
        <input v-model="form.fullName" placeholder="Имя и фамилия" />
        <input
          v-model="form.username"
          placeholder="Имя пользователя"
          pattern="[A-Za-z0-9._]{3,30}"
          title="3–30 символов: латиница, цифры, точка, подчёркивание"
          required
        />
        <input v-model="form.password" type="password" placeholder="Пароль (мин. 6 символов)" minlength="6" required />
        <button class="btn-primary" :disabled="loading">
          {{ loading ? 'Регистрация…' : 'Зарегистрироваться' }}
        </button>
        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
    <div class="auth-card small">
      Есть аккаунт?
      <RouterLink to="/login">Вход</RouterLink>
    </div>
  </div>
</template>
