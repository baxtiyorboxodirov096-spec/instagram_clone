<script setup>
import { ref, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import ChatList from '@/components/ChatList.vue'
import ChatWindow from '@/components/ChatWindow.vue'
import UserSearch from '@/components/UserSearch.vue'

const chat = useChatStore()
const showSearch = ref(false)

onMounted(async () => {
  chat.bindSocket()
  await chat.fetchChats()
})

async function startChat(userId) {
  showSearch.value = false
  await chat.openChatWith(userId)
}
</script>

<template>
  <div class="direct" :class="{ 'chat-open': chat.activeChatId }">
    <ChatList @new-chat="showSearch = true" />
    <ChatWindow @back="chat.activeChatId = null">
      <template #action>
        <button class="btn-primary" @click="showSearch = true">Отправить сообщение</button>
      </template>
    </ChatWindow>
    <UserSearch v-if="showSearch" @select="startChat" @close="showSearch = false" />
  </div>
</template>

<style scoped>
.direct {
  height: 100vh;
  display: grid;
  grid-template-columns: 380px 1fr;
  max-width: 1100px;
  margin: 0 auto;
  border-left: 1px solid var(--ig-border);
  border-right: 1px solid var(--ig-border);
}
.direct > * {
  min-height: 0;
}
@media (max-width: 768px) {
  .direct {
    grid-template-columns: 1fr;
    border: none;
  }
  .direct.chat-open > :first-child,
  .direct:not(.chat-open) > :nth-child(2) {
    display: none;
  }
}
</style>
