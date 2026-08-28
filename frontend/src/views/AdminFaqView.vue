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
          <h1 class="text-xl font-bold text-red-700">📋 Gestión de FAQ</h1>
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
      <!-- Botón agregar -->
      <div class="mb-6 flex justify-between items-center">
        <h2 class="text-lg font-semibold">Lista de FAQs</h2>
        <button 
          @click="abrirFormulario()" 
          class="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          + Agregar FAQ
        </button>
      </div>

      <!-- Formulario (Crear/Editar) -->
      <div v-if="mostrarFormulario" class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="font-semibold mb-4">{{ formularioEditando ? 'Editar FAQ' : 'Nueva FAQ' }}</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Pregunta *</label>
            <input 
              v-model="formulario.pregunta" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="¿Cuál es el horario de atención?"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Respuesta *</label>
            <textarea 
              v-model="formulario.respuesta" 
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="El horario de atención es de lunes a viernes de 8:00 AM a 5:00 PM"
            ></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <input 
              v-model="formulario.categoria" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="HORARIOS, CONTACTO, ADMISIONES..."
            />
          </div>
          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              v-model="formulario.activa" 
              id="activa"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <label for="activa" class="text-sm text-gray-700">Activa</label>
          </div>
          <div class="flex gap-2">
            <button 
              @click="guardarFaq" 
              class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              :disabled="cargando"
            >
              {{ cargando ? 'Guardando...' : 'Guardar' }}
            </button>
            <button 
              @click="cerrarFormulario" 
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pregunta</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(faq, index) in faqs" :key="faq.id">
              <td class="px-6 py-4 text-sm text-gray-500">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ faq.pregunta }}</td>
              <td class="px-6 py-4 text-sm text-gray-500">
                <span class="px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {{ faq.categoria || '-' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span 
                  :class="faq.activa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 rounded-full text-xs"
                >
                  {{ faq.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm space-x-2">
                <button @click="editarFaq(faq)" class="text-blue-600 hover:text-blue-800">
                  Editar
                </button>
                <button @click="toggleFaq(faq)" class="text-yellow-600 hover:text-yellow-800">
                  {{ faq.activa ? '🔴 Desactivar' : '🟢 Activar' }}
                </button>
                <button @click="eliminarFaq(faq.id)" class="text-red-600 hover:text-red-800">
                  eliminar
                </button>
              </td>
            </tr>
            <tr v-if="faqs.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-gray-500">No hay FAQs registradas</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación simple -->
      <div class="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Total: {{ faqs.length }} FAQs</span>
        <span>Última actualización: {{ fechaActualizacion }}</span>
      </div>
    </main>

    <!-- Chat Widget -->
    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import ChatWidget from '../components/chatbot/ChatWidget.vue'
import api from '../services/api'

const authStore = useAuthStore()
const faqs = ref([])
const cargando = ref(false)
const mostrarFormulario = ref(false)
const formularioEditando = ref(false)
const formulario = ref({
  id: null,
  pregunta: '',
  respuesta: '',
  categoria: '',
  activa: true
})

const fechaActualizacion = computed(() => {
  return new Date().toLocaleString('es-CO')
})

function abrirFormulario(faq = null) {
  if (faq) {
    formularioEditando.value = true
    formulario.value = {
      id: faq.id,
      pregunta: faq.pregunta,
      respuesta: faq.respuesta,
      categoria: faq.categoria || '',
      activa: faq.activa !== undefined ? faq.activa : true
    }
  } else {
    formularioEditando.value = false
    formulario.value = {
      id: null,
      pregunta: '',
      respuesta: '',
      categoria: '',
      activa: true
    }
  }
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  formularioEditando.value = false
}

async function cargarFaqs() {
  try {
    const response = await api.get('/api/admin/chatbot/faqs')
    faqs.value = response.data
  } catch (error) {
    console.error('Error cargando FAQs:', error)
    alert('Error al cargar las FAQs')
  }
}

async function guardarFaq() {
  if (!formulario.value.pregunta || !formulario.value.respuesta) {
    alert('La pregunta y respuesta son obligatorias')
    return
  }
  
  cargando.value = true
  try {
    if (formularioEditando.value) {
      // Actualizar
      await api.put(`/api/admin/chatbot/faqs/${formulario.value.id}`, formulario.value)
    } else {
      // Crear
      await api.post('/api/admin/chatbot/faqs', {
        pregunta: formulario.value.pregunta,
        respuesta: formulario.value.respuesta,
        categoria: formulario.value.categoria,
        activa: formulario.value.activa
      })
    }
    await cargarFaqs()
    cerrarFormulario()
  } catch (error) {
    console.error('Error guardando FAQ:', error)
    alert('Error al guardar la FAQ')
  } finally {
    cargando.value = false
  }
}

function editarFaq(faq) {
  abrirFormulario(faq)
}

async function toggleFaq(faq) {
  try {
    await api.put(`/api/admin/chatbot/faqs/${faq.id}`, { 
      ...faq, 
      activa: !faq.activa 
    })
    await cargarFaqs()
  } catch (error) {
    console.error('Error actualizando FAQ:', error)
    alert('Error al cambiar el estado de la FAQ')
  }
}

async function eliminarFaq(id) {
  if (!confirm('¿Estás seguro de eliminar esta FAQ?')) return
  try {
    await api.delete(`/api/admin/chatbot/faqs/${id}`)
    await cargarFaqs()
  } catch (error) {
    console.error('Error eliminando FAQ:', error)
    alert('Error al eliminar la FAQ')
  }
}

onMounted(() => {
  cargarFaqs()
})
</script>
