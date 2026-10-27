import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (token) => {
  if (socket) socket.disconnect()
  // Путь /socket.io проксируется Vite на бэкенд (см. vite.config.js)
  socket = io({ auth: { token } })
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) socket.disconnect()
  socket = null
}
