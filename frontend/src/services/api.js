import axios from 'axios'

// En desarrollo, Vite reenvía /api al backend y evita depender de un host fijo.
const API_BASE_URL = import.meta.env.VITE_API_URL || '/'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Interceptor para manejar errores 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    if (status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.assign(`${import.meta.env.BASE_URL}login`)
    }

    // Acceso denegado: evitar múltiples errores en consola y redirigir al dashboard
    if (status === 403) {
      try {
        // Mostrar mensaje simple al usuario y redirigir a dashboard
        // No eliminar token ya que podría ser un permiso faltante
        window.alert('Acceso denegado: no tienes permisos para realizar esta acción.')
        window.location.assign(`${import.meta.env.BASE_URL}dashboard`)
      } catch (e) {
        // no-op
      }
    }
    return Promise.reject(error)
  }
)

export default api
