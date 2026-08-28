<template>
  <div class="admin-view with-shared-sidebar">
    <header class="bg-white shadow"><div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center"><div class="flex items-center gap-4"><router-link to="/" aria-label="Ir al inicio"><img src="../img/logo_dario.png" alt="Logo institucional" class="h-12 w-12 object-contain drop-shadow-md" /></router-link><router-link to="/dashboard" class="text-gray-600 hover:text-gray-800">← Volver</router-link><h1 class="text-xl font-bold text-red-700">Gestión de sinónimos</h1></div><div class="flex items-center gap-4"><router-link to="/" class="text-red-700 text-sm">Ver sitio</router-link><button @click="authStore.logout" class="text-red-500 text-sm">Cerrar sesión</button></div></div></header>
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="font-semibold mb-4">Agregar sinónimo</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input v-model="formulario.palabraBase" class="input" placeholder="Palabra base" />
          <input v-model="formulario.sinonimo" class="input" placeholder="Sinónimo" />
          <select v-model="formulario.intencionId" class="input"><option :value="null">Sin intención</option><option v-for="i in intenciones" :key="i.id" :value="i.id">{{ i.nombre }}</option></select>
          <button @click="crear" class="button bg-red-700">Agregar</button>
        </div>
      </div>
      <p v-if="error" class="mb-4 rounded bg-red-100 p-3 text-red-700">{{ error }}</p>
      <div class="bg-white rounded-lg shadow overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"><thead class="bg-gray-50"><tr><th class="cell">Palabra base</th><th class="cell">Sinónimo</th><th class="cell">Intención</th><th class="cell">Estado</th><th class="cell">Acciones</th></tr></thead><tbody class="divide-y divide-gray-200"><tr v-for="item in sinonimos" :key="item.id"><td class="cell"><input v-model="item.palabraBase" class="input" /></td><td class="cell"><input v-model="item.sinonimo" class="input" /></td><td class="cell">{{ item.intencionNombre || 'General' }}</td><td class="cell"><label><input v-model="item.activa" type="checkbox" class="mr-2" />Activa</label></td><td class="cell whitespace-nowrap"><button @click="guardar(item)" class="button bg-green-600 mr-2">Guardar</button><button @click="eliminar(item.id)" class="button bg-red-600">Eliminar</button></td></tr><tr v-if="!sinonimos.length"><td colspan="5" class="cell text-center text-gray-500">No hay sinónimos registrados</td></tr></tbody></table></div>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../services/api'
const authStore = useAuthStore(); const sinonimos = ref([]); const intenciones = ref([]); const error = ref(''); const formulario = ref({ palabraBase: '', sinonimo: '', intencionId: null })
async function cargar() { try { [sinonimos.value, intenciones.value] = await Promise.all([(await api.get('/api/admin/chatbot/sinonimos')).data, (await api.get('/api/admin/chatbot/intenciones')).data] ) } catch (e) { error.value = e.response?.data?.error || 'No se pudieron cargar los sinónimos' } }
async function crear() { if (!formulario.value.palabraBase || !formulario.value.sinonimo) return; await api.post('/api/admin/chatbot/sinonimos', { ...formulario.value, activa: true }); formulario.value = { palabraBase: '', sinonimo: '', intencionId: null }; await cargar() }
async function guardar(item) { await api.put(`/api/admin/chatbot/sinonimos/${item.id}`, item); await cargar() }
async function eliminar(id) { if (confirm('¿Eliminar este sinónimo?')) { await api.delete(`/api/admin/chatbot/sinonimos/${id}`); await cargar() } }
onMounted(cargar)
</script>

<style scoped>
.input { margin-top: 0.25rem; width: 100%; border: 1px solid #d1d5db; border-radius: 0.25rem; padding: 0.5rem 0.75rem; }
.input:focus { outline: none; box-shadow: 0 0 0 2px #3b82f6; }
.button { border-radius: 0.25rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; color: white; }
.button:hover { opacity: 0.9; }
.cell { padding: 0.75rem 1rem; text-align: left; font-size: 0.875rem; }
</style>