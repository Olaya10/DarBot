<template>
  <div class="admin-view with-shared-sidebar">
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4"><router-link to="/" aria-label="Ir al inicio"><img src="../img/logo_dario.png" alt="Logo institucional" class="h-12 w-12 object-contain drop-shadow-md" /></router-link><router-link to="/dashboard" class="text-gray-600 hover:text-gray-800">← Volver</router-link><h1 class="text-xl font-bold text-red-700">Gestión de intenciones</h1></div>
        <div class="flex items-center gap-4"><router-link to="/" class="text-red-700 text-sm">Ver sitio</router-link><button @click="authStore.logout" class="text-red-500 text-sm">Cerrar sesión</button></div>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-8">
      <p v-if="error" class="mb-4 rounded bg-red-100 p-3 text-red-700">{{ error }}</p>
      <p v-if="!cargando && intenciones.length" class="mb-3 text-sm text-gray-600">{{ intenciones.length }} intenciones registradas. Selecciona una para editarla.</p>
      <details v-for="intencion in intenciones" :key="intencion.id" class="bg-white rounded-lg shadow mb-3">
        <summary class="cursor-pointer list-none px-5 py-4">
          <span class="font-semibold text-gray-900">{{ intencion.nombre }}</span>
          <span class="mx-2 text-gray-400">·</span>
          <span class="text-sm text-gray-500">{{ intencion.descripcion || 'Sin descripción' }}</span>
          <span :class="intencion.activa ? 'text-green-600' : 'text-red-600'" class="float-right text-sm">{{ intencion.activa ? 'Activa' : 'Inactiva' }}</span>
        </summary>
        <div class="border-t p-5">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label class="text-sm font-medium">Nombre<input v-model="intencion.nombre" class="input" /></label>
          <label class="text-sm font-medium md:col-span-2">Descripción<input v-model="intencion.descripcion" class="input" /></label>
          <label class="text-sm font-medium">Prioridad<input v-model.number="intencion.prioridad" type="number" min="0" max="100" class="input" /></label>
        </div>
        <label class="block text-sm font-medium mt-4">Respuesta por defecto<textarea v-model="intencion.respuestaPorDefecto" rows="2" class="input"></textarea></label>
        <div class="flex flex-wrap gap-4 items-center mt-4">
          <label class="text-sm"><input v-model="intencion.activa" type="checkbox" class="mr-2" />Activa</label>
          <button @click="guardarIntencion(intencion)" class="button bg-red-700">Guardar cambios</button>
        </div>
        <div class="border-t mt-5 pt-4">
          <h2 class="font-semibold mb-3">Palabras clave</h2>
          <div v-for="palabra in intencion.palabrasClave" :key="palabra.id" class="flex flex-wrap gap-2 mb-2">
            <input v-model="palabra.palabra" class="input flex-1 min-w-40" />
            <input v-model.number="palabra.peso" type="number" min="1" max="10" class="input w-24" title="Peso" />
            <button @click="guardarPalabra(palabra)" class="button bg-green-600">Guardar</button>
            <button @click="eliminarPalabra(palabra.id)" class="button bg-red-600">Eliminar palabra</button>
          </div>
          <div class="flex flex-wrap gap-2 mt-3">
            <input v-model="nuevasPalabras[intencion.id]" class="input flex-1 min-w-52" placeholder="Ej. eventos" />
            <button @click="agregarPalabra(intencion)" class="button bg-gray-700">Agregar palabra</button>
          </div>
        </div>
        </div>
      </details>
      <p v-if="!cargando && !intenciones.length" class="bg-white rounded-lg p-6 text-gray-500">No hay intenciones cargadas. Ejecuta el script de datos iniciales.</p>
      <p v-if="cargando" class="text-gray-500">Cargando intenciones...</p>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'

const authStore = useAuthStore()
const intenciones = ref([])
const nuevasPalabras = ref({})
const cargando = ref(true)
const error = ref('')

async function cargar() {
  try { intenciones.value = (await api.get('/api/admin/chatbot/intenciones')).data } catch (e) { error.value = e.response?.data?.error || 'No se pudieron cargar las intenciones' } finally { cargando.value = false }
}
async function guardarIntencion(intencion) { await api.put(`/api/admin/chatbot/intenciones/${intencion.id}`, intencion); await cargar() }
async function agregarPalabra(intencion) {
  const palabra = nuevasPalabras.value[intencion.id]?.trim()
  if (!palabra) return
  await api.post(`/api/admin/chatbot/intenciones/${intencion.id}/palabras-clave`, { palabra, peso: 1, esSinonimo: false })
  nuevasPalabras.value[intencion.id] = ''; await cargar()
}
async function guardarPalabra(palabra) { await api.put(`/api/admin/chatbot/palabras-clave/${palabra.id}`, palabra); await cargar() }
async function eliminarPalabra(id) { if (confirm('¿Eliminar esta palabra clave?')) { await api.delete(`/api/admin/chatbot/palabras-clave/${id}`); await cargar() } }
onMounted(cargar)
</script>

<style scoped>
.input { margin-top: 0.25rem; width: 100%; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.5rem 0.75rem; font-weight: 400; }
.input:focus { outline: none; box-shadow: 0 0 0 2px #3b82f6; }
.button { border-radius: 0.25rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: white; }
.button:hover { opacity: 0.9; }
</style>