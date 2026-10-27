import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const errorMessage = (err) =>
  err?.response?.data?.message || err?.message || 'Что-то пошло не так'

export default http
