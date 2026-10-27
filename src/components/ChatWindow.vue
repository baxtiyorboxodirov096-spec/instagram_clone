<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { timeAgo, formatTime } from '@/utils/time'
import UserAvatar from './UserAvatar.vue'

const emit = defineEmits(['back'])

const auth = useAuthStore()
const chat = useChatStore()

const text = ref('')
const sending = ref(false)
const scroller = ref(null)
const loadingOlder = ref(false)

const other = computed(() => chat.otherUser(chat.activeChat))
const online = computed(() => chat.isOnline(other.value))
const isTyping = computed(() => chat.typing[chat.activeChatId])

const status = computed(() => {
  if (isTyping.value) return 'печатает…'
  if (online.value) return 'в сети'
  return other.value?.lastSeen ? `был(а) ${timeAgo(other.value.lastSeen)} назад` : ''
})

const isMine = (m) => m.sender._id === auth.user?._id

// Последнее моё сообщение, которое прочитал собеседник
const lastSeenId = computed(() => {
  const list = chat.activeMessages
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]
    if (isMine(m) && m.readBy.includes(other.value?._id)) return m._id
    if (!isMine(m)) return null
  }
  return null
})

function scrollToBottom() {
  nextTick(() => {
    if (scroller.value) scroller.value.scrollTop = scroller.value.scrollHeight
  })
}

watch(() => chat.activeChatId, scrollToBottom)
watch(() => chat.activeMessages.length, (n, o) => {
  if (!loadingOlder.value || n - o === 1) scrollToBottom()
})

async function onScroll() {
  const el = scroller.value
  if (el.scrollTop > 40 || loadingOlder.value || !chat.hasMore[chat.activeChatId]) return
  loadingOlder.value = true
  const prevHeight = el.scrollHeight
  try {
    await chat.loadOlder()
    await nextTick()
    el.scrollTop = el.scrollHeight - prevHeight
  } finally {
    loadingOlder.value = false
  }
}

let typingTimer = null
let typingSent = false
function onInput() {
  if (!typingSent) {
    chat.emitTyping(true)
    typingSent = true
  }
  clearTimeout(typingTimer)
  typingTimer = setTimeout(stopTyping, 1500)
}
function stopTyping() {
  clearTimeout(typingTimer)
  if (typingSent) chat.emitTyping(false)
  typingSent = false
}

async function send() {
  const value = text.value.trim()
  if (!value || sending.value) return
  sending.value = true
  stopTyping()
  try {
    await chat.sendMessage(value)
    text.value = ''
  } catch (err) {
    alert(err.message || 'Не удалось отправить сообщение')
  } finally {
    sending.value = false
  }
}

// Показываем время, если между сообщениями прошло больше 15 минут
function showTime(i) {
  if (i === 0) return true
  const list = chat.activeMessages
  return new Date(list[i].createdAt) - new Date(list[i - 1].createdAt) > 15 * 60 * 1000
}
</script>

<template>
  <section v-if="chat.activeChat" class="window">
    <header>
      <button class="back" @click="emit('back')">‹</button>
      <UserAvatar :user="other" :size="44" :online="online" />
      <div>
        <div class="name">{{ other?.fullName || other?.username }}</div>
        <div class="muted small">{{ status }}</div>
      </div>
    </header>

    <div ref="scroller" class="messages" @scroll="onScroll">
      <div v-if="loadingOlder" class="muted center small">Загрузка…</div>

      <div class="intro">
        <UserAvatar :user="other" :size="96" />
        <div class="name big">{{ other?.fullName || other?.username }}</div>
        <div class="muted">{{ other?.username }} · Instagram</div>
      </div>

      <template v-for="(m, i) in chat.activeMessages" :key="m._id">
        <div v-if="showTime(i)" class="time muted">{{ formatTime(m.createdAt) }}</div>
        <div class="row" :class="{ mine: isMine(m) }">
          <div class="bubble" :title="formatTime(m.createdAt)">{{ m.text }}</div>
        </div>
        <div v-if="m._id === lastSeenId" class="seen muted">Просмотрено</div>
      </template>

      <div v-if="isTyping" class="row">
        <div class="bubble typing"><i /><i /><i /></div>
      </div>
    </div>

    <form class="composer" @submit.prevent="send">
      <input
        v-model="text"
        placeholder="Напишите сообщение..."
        maxlength="2000"
        @input="onInput"
        @blur="stopTyping"
      />
      <button v-if="text.trim()" type="submit" class="send" :disabled="sending">Отправить</button>
    </form>
  </section>

  <section v-else class="placeholder">
    <div class="icon">✉</div>
    <h2>Ваши сообщения</h2>
    <p class="muted">Отправляйте личные сообщения другу или группе.</p>
    <slot name="action" />
  </section>
</template>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
}
header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ig-border);
}
.back {
  display: none;
  font-size: 32px;
  line-height: 1;
}
.name {
  font-weight: 600;
}
.big {
  font-size: 20px;
  margin-top: 12px;
}
.small {
  font-size: 12px;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 32px;
}
.time {
  text-align: center;
  font-size: 12px;
  margin: 12px 0 8px;
}
.row {
  display: flex;
}
.row.mine {
  justify-content: flex-end;
}
.bubble {
  max-width: 65%;
  padding: 8px 12px;
  border-radius: 20px;
  background: var(--ig-bubble);
  word-wrap: break-word;
  white-space: pre-wrap;
}
.mine .bubble {
  background: var(--ig-blue-bubble);
  color: #fff;
}
.seen {
  text-align: right;
  font-size: 12px;
  margin: 2px 4px 4px;
}
.typing {
  display: flex;
  gap: 4px;
  padding: 12px 14px;
}
.typing i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ig-muted);
  animation: blink 1.2s infinite;
}
.typing i:nth-child(2) {
  animation-delay: 0.2s;
}
.typing i:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%, 60%, 100% { opacity: 0.3; }
  30% { opacity: 1; }
}
.composer {
  display: flex;
  align-items: center;
  margin: 16px;
  padding: 6px 16px;
  border: 1px solid var(--ig-border);
  border-radius: 22px;
}
.composer input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 0;
}
.send {
  color: var(--ig-blue);
  font-weight: 600;
}
.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 24px;
}
.placeholder .icon {
  font-size: 48px;
  width: 96px;
  height: 96px;
  border: 2px solid var(--ig-text);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder h2 {
  margin: 8px 0 0;
  font-size: 20px;
}
.center {
  text-align: center;
}
@media (max-width: 768px) {
  .back {
    display: block;
  }
}
</style>
