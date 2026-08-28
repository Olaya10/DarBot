import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '../services/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || '')
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)

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
    window.location.assign('/login')
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout
  }
})
