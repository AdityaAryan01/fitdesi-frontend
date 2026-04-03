import axios from 'axios'

// If you are using Vite Proxy, baseURL should be '/api'
// If you are NOT using proxy, use 'http://localhost:8000/api'
const api = axios.create({ baseURL: '/api' })

/**
 * CHAT & HISTORY
 */

// Sends a message to a specific thread
export const sendChat = (user_id, thread_id, message) =>
  api.post('/chat', { 
    user_id: String(user_id), 
    thread_id: String(thread_id), 
    message 
  }).then(r => r.data)

// Fetches the real conversation history for a specific thread from AI memory
export const getChatHistory = (thread_id) =>
  api.get(`/chat/history/${String(thread_id)}`).then(r => r.data)


/**
 * THREAD MANAGEMENT (Sidebar)
 */

// Lists all previous conversations for a user
export const getThreads = (user_id) =>
  api.get(`/user/${String(user_id)}/threads`).then(r => r.data)

// Creates a new conversation entry in the database
export const createThread = (user_id) =>
  api.post(`/user/${String(user_id)}/threads`).then(r => r.data)

// Deletes a specific conversation
export const deleteThread = (user_id, thread_id) =>
  api.delete(`/user/${String(user_id)}/threads/${String(thread_id)}`).then(r => r.data)

export const renameThread = (user_id, thread_id, new_title) =>
  api.put(`/user/${String(user_id)}/threads/${String(thread_id)}`, { title: new_title }).then(r => r.data)
/**
 * USER & LOGS
 */

// Fetches today's total macros and meal list
export const getProgress = (user_id) =>
  api.get(`/user/${String(user_id)}/progress`).then(r => r.data)

// Fetches the detailed meal log list for the Logs page
export const getMealLogs = (user_id) =>
  api.get(`/user/${String(user_id)}/logs`).then(r => r.data)

// Fetches basic user profile info
export const getUser = (user_id) =>
  api.get(`/user/${String(user_id)}`).then(r => r.data)

// Onboarding: Creates a new user profile in SQLite
export const createUser = (data) =>
  api.post('/user', data).then(r => r.data)

export default api