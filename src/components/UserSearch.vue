<script setup>
import { ref, watch } from 'vue'
import http from '@/api/http'
import UserAvatar from './UserAvatar.vue'

const emit = defineEmits(['select', 'close'])

const query = ref('')
const users = ref([])
const loading = ref(false)
let timer = null

async function search() {
  loading.value = true
  try {
    const { data } = await http.get('/auth/users', { params: { search: query.value } })
    users.value = data.users
  } finally {
    loading.value = false
  }
}

watch(query, () => {
  clearTimeout(timer)
  timer = setTimeout(search, 300)
})

search()
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <header>
        <span>Новое сообщение</span>
        <button class="close" @click="emit('close')">✕</button>
      </header>
      <div class="search">
        <label>Кому:</label>
        <input v-model="query" placeholder="Поиск..." autofocus />
      </div>
      <ul>
        <li v-if="loading && !users.length" class="hint">Поиск…</li>
        <li v-else-if="!users.length" class="hint">Пользователи не найдены</li>
        <li v-for="u in users" :key="u._id" class="user" @click="emit('select', u._id)">
          <UserAvatar :user="u" :size="44" />
          <div>
            <div class="username">{{ u.username }}</div>
            <div class="muted">{{ u.fullName }}</div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
.modal {
  width: min(400px, 92vw);
  max-height: 70vh;
  background: var(--ig-bg);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
header {
  display: flex;
  justify-content: center;
  position: relative;
  padding: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--ig-border);
}
.close {
  position: absolute;
  right: 12px;
  top: 8px;
  font-size: 18px;
}
.search {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--ig-border);
}
.search label {
  font-weight: 600;
}
.search input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 6px 0;
}
ul {
  list-style: none;
  margin: 0;
  padding: 8px 0;
  overflow-y: auto;
}
.user {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
}
.user:hover {
  background: var(--ig-hover);
}
.username {
  font-weight: 600;
}
.hint {
  padding: 16px;
  text-align: center;
  color: var(--ig-muted);
}
</style>
