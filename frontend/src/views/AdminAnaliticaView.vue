<template>
  <div class="admin-view with-shared-sidebar">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <router-link to="/" aria-label="Ir al inicio"><img src="../img/logo_dario.png" alt="Logo institucional" class="h-12 w-12 object-contain drop-shadow-md" /></router-link>
          <router-link to="/dashboard" class="text-gray-600 hover:text-gray-800">
            ← Volver
          </router-link>
          <h1 class="text-xl font-bold text-red-700">📊 Analítica</h1>
        </div>
        <div class="flex items-center gap-4">
          <router-link to="/" class="text-red-700 text-sm">Ver sitio</router-link>
          <span class="text-gray-600 text-sm">{{ authStore.user?.username }}</span>
          <button @click="authStore.logout" class="text-red-500 hover:text-red-700 text-sm">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido -->
    <main class="max-w-7xl mx-auto px-4 py-8">
      <!-- Tarjetas de resumen -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Total preguntas</h3>
          <p class="text-3xl font-bold">{{ estadisticas.total || 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">👍 Positivos</h3>
          <p class="text-3xl font-bold text-green-600">{{ estadisticas.positivos || 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">👎 Negativos</h3>
          <p class="text-3xl font-bold text-red-600">{{ estadisticas.negativos || 0 }}</p>
        </div>
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-gray-500 text-sm font-medium">Tasa aprobación</h3>
          <p class="text-3xl font-bold text-blue-600">{{ estadisticas.tasa || 0 }}%</p>
        </div>
      </div>

      <!-- Feedback diario -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="font-semibold mb-4">📈 Feedback por día</h3>
        <div v-if="Object.keys(estadisticas.ultimos_7_dias || {}).length === 0" class="text-gray-500 text-sm">
          No hay datos de feedback en los últimos 7 días.
        </div>
        <div v-else class="space-y-2">
          <div v-for="(dia, fecha) in estadisticas.ultimos_7_dias" :key="fecha" class="flex items-center gap-4">
            <span class="text-sm w-28">{{ fecha }}</span>
            <div class="flex-1 flex gap-1">
              <div 
                class="h-6 bg-green-500 rounded" 
                :style="{ width: (dia.positivos / (dia.positivos + dia.negativos || 1) * 100) + '%' }"
              ></div>
              <div 
                class="h-6 bg-red-500 rounded" 
                :style="{ width: (dia.negativos / (dia.positivos + dia.negativos || 1) * 100) + '%' }"
              ></div>
            </div>
            <span class="text-sm w-20 text-right">
              👍 {{ dia.positivos }} 👎 {{ dia.negativos }}
            </span>
          </div>
        </div>
      </div>
    </main>

    <!-- Chat Widget -->
    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import ChatWidget from '../components/chatbot/ChatWidget.vue'
import { chatbotService } from '../services/chatbot'

const authStore = useAuthStore()
const estadisticas = ref({})

async function cargarEstadisticas() {
  try {
    const data = await chatbotService.obtenerEstadisticas()
    estadisticas.value = {
      total: data.total_feedback || 0,
      positivos: data.positivos || 0,
      negativos: data.negativos || 0,
      tasa: Math.round(data.tasa_aprobacion || 0),
      ultimos_7_dias: data.ultimos_7_dias || {}
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error)
  }
}

onMounted(() => {
  cargarEstadisticas()
})
</script>
