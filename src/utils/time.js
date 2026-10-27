export function timeAgo(date) {
  const diff = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return 'сейчас'
  if (diff < 3600) return `${Math.floor(diff / 60)} мин.`
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч.`
  if (diff < 604800) return `${Math.floor(diff / 86400)} дн.`
  return `${Math.floor(diff / 604800)} нед.`
}

export function formatTime(date) {
  const d = new Date(date)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  return sameDay
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
}
