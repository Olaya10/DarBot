<template>
  <div class="admin-view with-shared-sidebar">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <router-link to="/" aria-label="Ir al inicio"><img src="../img/logo_dario.png" alt="Logo institucional" class="h-12 w-12 object-contain drop-shadow-md" /></router-link>
          <router-link to="/dashboard" class="text-gray-600 hover:text-gray-800">← Volver</router-link>
          <h1 class="text-xl font-bold text-red-700">Preguntas sin respuesta</h1>
        </div>
        <div class="flex items-center gap-4"><router-link to="/" class="text-red-700 text-sm">Ver sitio</router-link><button @click="authStore.logout" class="text-red-500 text-sm">Cerrar sesión</button></div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p class="text-sm text-gray-600">{{ preguntas.length }} preguntas mostradas</p>
        <select v-model="filtro" @change="cargar" class="rounded border border-gray-300 bg-white px-3 py-2 text-sm">
          <option value="false">Pendientes</option>
          <option value="true">Resueltas</option>
          <option value="">Todas</option>
        </select>
      </div>

      <p v-if="error" class="mb-4 rounded bg-red-100 p-3 text-red-700">{{ error }}</p>
      <div class="bg-white rounded-lg shadow overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="cell">Pregunta</th>
              <th class="cell">Intención detectada</th>
              <th class="cell">Fecha</th>
              <th class="cell">Estado</th>
              <th class="cell">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="pregunta in preguntas" :key="pregunta.id">
              <td class="cell max-w-lg">{{ pregunta.pregunta }}</td>
              <td class="cell text-gray-500">{{ pregunta.intentoIntencion || 'Sin detectar' }}</td>
              <td class="cell text-gray-500 whitespace-nowrap">{{ formatearFecha(pregunta.fecha) }}</td>
              <td class="cell"><span :class="pregunta.resuelta ? 'text-green-600' : 'text-orange-600'">{{ pregunta.resuelta ? 'Resuelta' : 'Pendiente' }}</span></td>
              <td class="cell whitespace-nowrap">
                <button v-if="!pregunta.resuelta" @click="resolver(pregunta.id)" class="button bg-green-600 mr-2">Marcar resuelta</button>
                <button v-else @click="reabrir(pregunta.id)" class="button bg-yellow-600 mr-2">Reabrir</button>
                <button @click="eliminar(pregunta.id)" class="button bg-red-600">Eliminar</button>
              </td>
            </tr>
            <tr v-if="!preguntas.length"><td colspan="5" class="cell text-center text-gray-500">No hay preguntas en este estado.</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const authStore = useAuthStore()
const preguntas = ref([])
const filtro = ref('false')
const error = ref('')

async function cargar() {
  try {
    const query = filtro.value === '' ? '' : `?resuelta=${filtro.value}`
    preguntas.value = (await api.get(`/api/admin/chatbot/preguntas${query}`)).data
    error.value = ''
  } catch (e) {
    error.value = e.response?.data?.error || 'No se pudieron cargar las preguntas'
  }
}
async function resolver(id) { await api.put(`/api/admin/chatbot/preguntas/${id}/resolver`); await cargar() }
async function reabrir(id) { await api.put(`/api/admin/chatbot/preguntas/${id}/reabrir`); await cargar() }
async function eliminar(id) { if (confirm('¿Eliminar esta pregunta?')) { await api.delete(`/api/admin/chatbot/preguntas/${id}`); await cargar() } }
function formatearFecha(fecha) { return fecha ? new Date(fecha).toLocaleString('es-CO') : '-' }
onMounted(cargar)
</script>

<style scoped>
.cell { padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; }
.button { border-radius: 0.25rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: white; }
.button:hover { opacity: 0.9; }
</style>
