<script setup>
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { timeAgo } from '@/utils/time'
import UserAvatar from './UserAvatar.vue'

const emit = defineEmits(['new-chat'])

const auth = useAuthStore()
const chat = useChatStore()

function preview(c) {
  if (chat.typing[c._id]) return 'печатает…'
  const m = c.lastMessage
  if (!m) return 'Начните переписку'
  const prefix = m.sender?._id === auth.user?._id ? 'Вы: ' : ''
  return prefix + m.text
}
</script>

<template>
  <aside class="list">
    <header>
      <span class="me">{{ auth.user?.username }}</span>
      <div class="actions">
        <button title="Новое сообщение" @click="emit('new-chat')">✎</button>
        <button title="Выйти" @click="$router.push('/logout')">⎋</button>
      </div>
    </header>

    <h3>Сообщения</h3>

    <div v-if="!chat.chats.length" class="empty">
      Пока нет диалогов.<br />
      <button class="link" @click="emit('new-chat')">Написать кому-нибудь</button>
    </div>

    <ul>
      <li
        v-for="c in chat.chats"
        :key="c._id"
        :class="{ active: c._id === chat.activeChatId }"
        @click="chat.selectChat(c._id)"
      >
        <UserAvatar
          :user="chat.otherUser(c)"
          :size="56"
          :online="chat.isOnline(chat.otherUser(c))"
        />
        <div class="info">
          <div class="name" :class="{ bold: c.unreadCount }">
            {{ chat.otherUser(c)?.fullName || chat.otherUser(c)?.username }}
          </div>
          <div class="preview" :class="{ bold: c.unreadCount }">
            <span class="text">{{ preview(c) }}</span>
            <span v-if="c.lastMessage" class="muted"> · {{ timeAgo(c.lastMessage.createdAt) }}</span>
          </div>
        </div>
        <span v-if="c.unreadCount" class="badge">{{ c.unreadCount }}</span>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--ig-border);
  min-height: 0;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 12px;
}
.me {
  font-size: 20px;
  font-weight: 700;
}
.actions {
  display: flex;
  gap: 8px;
}
.actions button {
  font-size: 22px;
}
h3 {
  margin: 8px 24px;
  font-size: 16px;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
}
li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 24px;
  cursor: pointer;
}
li:hover {
  background: var(--ig-hover);
}
li.active {
  background: var(--ig-active);
}
.info {
  flex: 1;
  min-width: 0;
}
.preview {
  display: flex;
  font-size: 13px;
  color: var(--ig-muted);
}
.preview .text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview .muted {
  white-space: nowrap;
}
.bold {
  font-weight: 700;
  color: var(--ig-text);
}
.badge {
  background: var(--ig-blue);
  color: #fff;
  font-size: 12px;
  border-radius: 10px;
  padding: 1px 7px;
}
.empty {
  padding: 24px;
  text-align: center;
  color: var(--ig-muted);
}
.link {
  color: var(--ig-blue);
  font-weight: 600;
  margin-top: 8px;
}
</style>
