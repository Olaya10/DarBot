import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  function readStoredUser() {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null')
    } catch {
      localStorage.removeItem('user')
      return null
    }
  }

  const user = ref(readStoredUser())
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.rol?.toUpperCase() === 'ADMIN')

  async function login(username, password) {
    loading.value = true
    error.value = null
    try {
      const data = await authService.login(username, password)
      token.value = data.token
      user.value = { 
        username: data.username, 
        email: data.email, 
        rol: data.rol, 
        id: data.userId 
      }
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(user.value))
      return data
    } catch (err) {
      error.value = err.response?.data?.error || err.response?.data?.message || 'Error al iniciar sesión'
      throw error.value
    } finally {
      loading.value = false
    }
  }

  function logout() {
    authService.logout()
    token.value = ''
    user.value = null
    window.location.assign(`${import.meta.env.BASE_URL}login`)
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout
  }
})
