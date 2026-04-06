// src/api/index.js
import axios from 'axios'
import { auth } from '../firebase'

const api = axios.create({ baseURL: '/api' })

// ── Attach Firebase ID token to every request automatically ─────
// The backend verifies this token to confirm the user is real.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

/**
 * CHAT & HISTORY
 */
export const sendChat = (user_id, thread_id, message) =>
  api.post('/chat', { user_id: String(user_id), thread_id: String(thread_id), message }).then(r => r.data)

export const getChatHistory = (thread_id) =>
  api.get(`/chat/history/${String(thread_id)}`).then(r => r.data)

/**
 * THREAD MANAGEMENT
 */
export const getThreads  = (user_id)                    => api.get(`/user/${String(user_id)}/threads`).then(r => r.data)
export const createThread = (user_id)                   => api.post(`/user/${String(user_id)}/threads`).then(r => r.data)
export const deleteThread = (user_id, thread_id)        => api.delete(`/user/${String(user_id)}/threads/${String(thread_id)}`).then(r => r.data)
export const renameThread = (user_id, thread_id, title) => api.put(`/user/${String(user_id)}/threads/${String(thread_id)}`, { title }).then(r => r.data)

/**
 * USER & LOGS
 */
export const getProgress = (user_id) => api.get(`/user/${String(user_id)}/progress`).then(r => r.data)
export const getWeeklyProgress = (userId) => api.get(`/user/${String(userId)}/weekly`).then(r => r.data)
export const getMealLogs = (user_id) => api.get(`/user/${String(user_id)}/logs`).then(r => r.data)
export const getUser     = (user_id) => api.get(`/user/${String(user_id)}`).then(r => r.data)
export const createUser  = (data)    => api.post('/user', data).then(r => r.data)

export default api