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
          <h1 class="text-xl font-bold text-red-700">Gestión de Contenido</h1>
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
      <!-- Tabs -->
      <div class="flex gap-2 mb-6 border-b">
        <button 
          v-for="tab in tabs" 
          :key="tab.key"
          @click="tabActivo = tab.key"
          class="px-4 py-2 font-medium text-sm transition-colors"
          :class="tabActivo === tab.key 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'"
        >
          {{ tab.label }} ({{ conteos[tab.key] || 0 }})
        </button>
      </div>

      <!-- Botón agregar -->
      <div class="mb-6 flex justify-end">
        <button 
          @click="abrirFormulario()" 
          class="bg-red-700 text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
        >
          + Agregar {{ tabActivo === 'noticias' ? 'Noticia' : tabActivo === 'eventos' ? 'Evento' : 'Documento' }}
        </button>
      </div>

      <!-- Formulario -->
      <div v-if="mostrarFormulario" class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="font-semibold mb-4">
          {{ formularioEditando ? 'Editar' : 'Nuevo' }} 
          {{ tabActivo === 'noticias' ? 'Noticia' : tabActivo === 'eventos' ? 'Evento' : 'Documento' }}
        </h3>
        <div class="space-y-4">
          <!-- Campos comunes -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input 
              v-model="formulario.titulo" 
              type="text" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Título..."
            />
          </div>

          <!-- Campos específicos -->
          <template v-if="tabActivo === 'noticias'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Resumen</label>
              <input 
                v-model="formulario.resumen" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Breve resumen..."
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contenido *</label>
              <textarea 
                v-model="formulario.contenido" 
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Contenido completo..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select 
                v-model="formulario.estado" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLICADA">Publicada</option>
                <option value="BORRADOR">Borrador</option>
                <option value="ARCHIVADA">Archivada</option>
              </select>
            </div>
          </template>

          <template v-if="tabActivo === 'eventos'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea 
                v-model="formulario.descripcion" 
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del evento..."
              ></textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input 
                  v-model="formulario.fecha" 
                  type="date" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input 
                  v-model="formulario.hora" 
                  type="time" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
              <input 
                v-model="formulario.lugar" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Auditorio, Polideportivo..."
              />
            </div>
          </template>

          <template v-if="tabActivo === 'documentos'">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
              <textarea 
                v-model="formulario.descripcion" 
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descripción del documento..."
              ></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select 
                v-model="formulario.tipo" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PDF">PDF</option>
                <option value="WORD">Word</option>
                <option value="EXCEL">Excel</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre del archivo</label>
              <input 
                v-model="formulario.nombreArchivo" 
                type="text" 
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ejemplo.pdf"
              />
            </div>
          </template>

          <div class="flex items-center gap-2">
            <input 
              type="checkbox" 
              v-model="formulario.activo" 
              id="activo"
              class="w-4 h-4 text-blue-600 rounded"
            />
            <label for="activo" class="text-sm text-gray-700">Activo</label>
          </div>

          <div class="flex gap-2">
            <button 
              @click="guardar" 
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
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Título</th>
              <th v-if="tabActivo === 'noticias'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th v-if="tabActivo === 'eventos'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th v-if="tabActivo === 'documentos'" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activo</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(item, index) in items" :key="item.id">
              <td class="px-6 py-4 text-sm text-gray-500">{{ index + 1 }}</td>
              <td class="px-6 py-4 text-sm text-gray-900">{{ item.titulo }}</td>
              <td v-if="tabActivo === 'noticias'" class="px-6 py-4 text-sm">
                <span 
                  :class="{
                    'bg-green-100 text-green-800': item.estado === 'PUBLICADA',
                    'bg-yellow-100 text-yellow-800': item.estado === 'BORRADOR',
                    'bg-gray-100 text-gray-800': item.estado === 'ARCHIVADA'
                  }"
                  class="px-2 py-1 rounded-full text-xs"
                >
                  {{ item.estado || 'PUBLICADA' }}
                </span>
              </td>
              <td v-if="tabActivo === 'eventos'" class="px-6 py-4 text-sm text-gray-500">
                {{ formatFecha(item.fecha) }}
              </td>
              <td v-if="tabActivo === 'documentos'" class="px-6 py-4 text-sm text-gray-500">
                <span class="px-2 py-1 bg-gray-100 rounded-full text-xs">{{ item.tipo || 'PDF' }}</span>
              </td>
              <td class="px-6 py-4 text-sm">
                <span 
                  :class="item.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                  class="px-2 py-1 rounded-full text-xs"
                >
                  {{ item.activo !== false ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="px-6 py-4 text-sm space-x-2">
                <button @click="editar(item)" class="text-blue-600 hover:text-blue-800">Editar</button>
                <button @click="toggleActivo(item)" class="text-yellow-600 hover:text-yellow-800">
                  {{ item.activo !== false ? '🔴' : '🟢' }}
                </button>
                <button @click="eliminar(item.id)" class="text-red-600 hover:text-red-800">Eliminar</button>
              </td>
            </tr>
            <tr v-if="items.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-gray-500">
                No hay {{ tabActivo === 'noticias' ? 'noticias' : tabActivo === 'eventos' ? 'eventos' : 'documentos' }} registrados
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-between items-center text-sm text-gray-500">
        <span>Total: {{ items.length }} elementos</span>
        <span>Última actualización: {{ fechaActualizacion }}</span>
      </div>
    </main>

    <!-- Chat Widget -->
    <ChatWidget />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import ChatWidget from '../components/chatbot/ChatWidget.vue'
import api from '../services/api'

const authStore = useAuthStore()

const tabs = [
  { key: 'noticias', label: 'Noticias' },
  { key: 'eventos', label: 'Eventos' },
  { key: 'documentos', label: 'Documentos' }
]

const tabActivo = ref('noticias')
const items = ref([])
const cargando = ref(false)
const mostrarFormulario = ref(false)
const formularioEditando = ref(false)
const conteos = ref({ noticias: 0, eventos: 0, documentos: 0 })

const formulario = ref({
  id: null,
  titulo: '',
  resumen: '',
  contenido: '',
  estado: 'PUBLICADA',
  descripcion: '',
  fecha: '',
  hora: '',
  lugar: '',
  tipo: 'PDF',
  nombreArchivo: '',
  activo: true
})

const fechaActualizacion = computed(() => {
  return new Date().toLocaleString('es-CO')
})

function formatFecha(fecha) {
  if (!fecha) return '-'
  const d = new Date(fecha)
  return d.toLocaleDateString('es-CO')
}

function getEndpoint() {
  const base = '/api/admin/contenidos'
  return {
    noticias: `${base}/noticias`,
    eventos: `${base}/eventos`,
    documentos: `${base}/documentos`
  }[tabActivo.value]
}

function getItemEndpoint(id) {
  return `${getEndpoint()}/${id}`
}

function abrirFormulario(item = null) {
  const vacio = {
    id: null,
    titulo: '',
    resumen: '',
    contenido: '',
    estado: 'PUBLICADA',
    descripcion: '',
    fecha: '',
    hora: '',
    lugar: '',
    tipo: 'PDF',
    nombreArchivo: '',
    activo: true
  }

  if (item) {
    formularioEditando.value = true
    formulario.value = { ...vacio, ...item }
    if (item.fecha) {
      const d = new Date(item.fecha)
      formulario.value.fecha = d.toISOString().split('T')[0]
    }
  } else {
    formularioEditando.value = false
    formulario.value = { ...vacio }
  }
  mostrarFormulario.value = true
}

function cerrarFormulario() {
  mostrarFormulario.value = false
  formularioEditando.value = false
}

async function cargarItems() {
  try {
    const response = await api.get(getEndpoint())
    items.value = response.data || []
    conteos.value[tabActivo.value] = items.value.length
  } catch (error) {
    console.error('Error cargando items:', error)
  }
}

async function guardar() {
  if (!formulario.value.titulo) {
    alert('El título es obligatorio')
    return
  }

  cargando.value = true
  try {
    const data = { ...formulario.value }
    delete data.id

    if (tabActivo.value === 'eventos' && data.fecha) {
      data.fecha = data.fecha
    }

    if (formularioEditando.value) {
      await api.put(getItemEndpoint(formulario.value.id), data)
    } else {
      await api.post(getEndpoint(), data)
    }
    await cargarItems()
    cerrarFormulario()
  } catch (error) {
    console.error('Error guardando:', error)
    alert('Error al guardar')
  } finally {
    cargando.value = false
  }
}

function editar(item) {
  abrirFormulario(item)
}

async function toggleActivo(item) {
  try {
    const data = { ...item, activo: item.activo !== false ? false : true }
    await api.put(getItemEndpoint(item.id), data)
    await cargarItems()
  } catch (error) {
    console.error('Error actualizando:', error)
  }
}

async function eliminar(id) {
  if (!confirm('¿Estás seguro de eliminar este elemento?')) return
  try {
    await api.delete(getItemEndpoint(id))
    await cargarItems()
  } catch (error) {
    console.error('Error eliminando:', error)
    alert('Error al eliminar')
  }
}

watch(tabActivo, () => {
  cargarItems()
  cerrarFormulario()
})

onMounted(() => {
  cargarItems()
})
</script>
