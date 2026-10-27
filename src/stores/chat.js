import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import http from '@/api/http'
import { getSocket } from '@/api/socket'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const chats = ref([])
  const activeChatId = ref(null)
  const messages = ref({}) // chatId -> Message[]
  const hasMore = ref({}) // chatId -> boolean
  const onlineIds = ref(new Set())
  const typing = ref({}) // chatId -> boolean

  const activeChat = computed(() => chats.value.find((c) => c._id === activeChatId.value) || null)
  const activeMessages = computed(() => messages.value[activeChatId.value] || [])

  const myId = () => useAuthStore().user?._id

  function otherUser(chat) {
    return chat?.participants.find((p) => p._id !== myId()) || null
  }

  function isOnline(user) {
    return !!user && onlineIds.value.has(user._id)
  }

  async function fetchChats() {
    const { data } = await http.get('/chats')
    chats.value = data.chats
  }

  async function openChatWith(userId) {
    const { data } = await http.post('/chats', { userId })
    if (!chats.value.some((c) => c._id === data.chat._id)) {
      chats.value.unshift(data.chat)
    }
    await selectChat(data.chat._id)
  }

  async function selectChat(chatId) {
    activeChatId.value = chatId
    if (!messages.value[chatId]) {
      const { data } = await http.get(`/chats/${chatId}/messages`)
      messages.value[chatId] = data.messages
      hasMore.value[chatId] = data.hasMore
    }
    markRead(chatId)
  }

  async function loadOlder() {
    const chatId = activeChatId.value
    const list = messages.value[chatId]
    if (!chatId || !list?.length || !hasMore.value[chatId]) return
    const { data } = await http.get(`/chats/${chatId}/messages`, {
      params: { before: list[0].createdAt },
    })
    messages.value[chatId] = [...data.messages, ...list]
    hasMore.value[chatId] = data.hasMore
  }

  async function markRead(chatId) {
    const chat = chats.value.find((c) => c._id === chatId)
    if (chat) chat.unreadCount = 0
    try {
      await http.put(`/chats/${chatId}/read`)
    } catch {
      /* не критично */
    }
  }

  function sendMessage(text) {
    const socket = getSocket()
    const chatId = activeChatId.value
    if (!socket || !chatId || !text.trim()) return Promise.resolve()
    return new Promise((resolve, reject) => {
      socket.emit('message:send', { chatId, text }, (res) =>
        res?.ok ? resolve(res.message) : reject(new Error(res?.error)),
      )
    })
  }

  function emitTyping(isTyping) {
    const socket = getSocket()
    if (socket && activeChatId.value) {
      socket.emit(isTyping ? 'typing:start' : 'typing:stop', { chatId: activeChatId.value })
    }
  }

  function handleNewMessage(message) {
    const list = messages.value[message.chat]
    if (list && !list.some((m) => m._id === message._id)) list.push(message)

    const chat = chats.value.find((c) => c._id === message.chat)
    if (!chat) {
      fetchChats() // новый диалог, которого ещё нет в списке
      return
    }
    chat.lastMessage = message
    chat.updatedAt = message.createdAt
    chats.value = [chat, ...chats.value.filter((c) => c._id !== chat._id)]

    const fromMe = message.sender._id === myId()
    if (!fromMe) {
      if (message.chat === activeChatId.value && !document.hidden) markRead(message.chat)
      else chat.unreadCount = (chat.unreadCount || 0) + 1
    }
    typing.value[message.chat] = false
  }

  function handleRead({ chatId, userId }) {
    const list = messages.value[chatId]
    if (!list) return
    list.forEach((m) => {
      if (!m.readBy.includes(userId)) m.readBy.push(userId)
    })
  }

  let listenersBound = null
  function bindSocket() {
    const socket = getSocket()
    if (!socket || listenersBound === socket) return
    listenersBound = socket

    socket.on('message:new', handleNewMessage)
    socket.on('message:read', handleRead)
    socket.on('users:online', (ids) => (onlineIds.value = new Set(ids)))
    socket.on('user:online', ({ userId }) => {
      onlineIds.value = new Set([...onlineIds.value, userId])
    })
    socket.on('user:offline', ({ userId, lastSeen }) => {
      const next = new Set(onlineIds.value)
      next.delete(userId)
      onlineIds.value = next
      chats.value.forEach((c) =>
        c.participants.forEach((p) => {
          if (p._id === userId) p.lastSeen = lastSeen
        }),
      )
    })
    socket.on('typing:start', ({ chatId }) => (typing.value[chatId] = true))
    socket.on('typing:stop', ({ chatId }) => (typing.value[chatId] = false))
  }

  function reset() {
    chats.value = []
    activeChatId.value = null
    messages.value = {}
    hasMore.value = {}
    onlineIds.value = new Set()
    typing.value = {}
    listenersBound = null
  }

  return {
    chats,
    activeChatId,
    activeChat,
    activeMessages,
    hasMore,
    typing,
    otherUser,
    isOnline,
    fetchChats,
    openChatWith,
    selectChat,
    loadOlder,
    sendMessage,
    emitTyping,
    bindSocket,
    reset,
  }
})
