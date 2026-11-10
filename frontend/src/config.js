const localApiHost =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? '127.0.0.1'
    : 'localhost'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'production'
    ? 'https://skeptique-hht6.onrender.com'
    : `http://${localApiHost}:3000`)

export default API_BASE_URL
