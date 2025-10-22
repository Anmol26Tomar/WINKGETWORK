import axios from 'axios'

const api = axios.create({
  baseURL: 'http://192.168.1.15:5000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api


