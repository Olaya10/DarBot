<template>
  <div class="admin-view with-shared-sidebar">
    <main class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-wider text-red-700">Administración</p>
          <h1 class="mt-1 text-3xl font-bold text-gray-900">Usuarios</h1>
          <p class="mt-2 text-gray-500">Gestiona accesos y permisos institucionales.</p>
        </div>
        <button @click="mostrarFormulario = !mostrarFormulario" class="rounded-md bg-red-700 px-4 py-2 font-semibold text-white transition hover:bg-red-800">
          {{ mostrarFormulario ? 'Cerrar formulario' : '+ Nuevo usuario' }}
        </button>
      </div>

      <section v-if="mostrarFormulario" class="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 class="mb-4 text-lg font-semibold">Registrar usuario</h2>
        <form class="grid grid-cols-1 gap-4 md:grid-cols-2" @submit.prevent="registrar">
          <input v-model.trim="formulario.username" required minlength="3" maxlength="50" placeholder="Usuario" class="rounded-md border px-3 py-2" />
          <input v-model.trim="formulario.nombre" required maxlength="100" placeholder="Nombre" class="rounded-md border px-3 py-2" />
          <input v-model.trim="formulario.apellido" required maxlength="100" placeholder="Apellido" class="rounded-md border px-3 py-2" />
          <input v-model.trim="formulario.correo" required type="email" maxlength="150" placeholder="Correo" class="rounded-md border px-3 py-2" />
          <input v-model="formulario.password" required minlength="8" type="password" placeholder="Contraseña" class="rounded-md border px-3 py-2" />
          <select v-model="formulario.rol" class="rounded-md border px-3 py-2"><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select>
          <div class="md:col-span-2 flex items-center gap-3">
            <button :disabled="guardando" class="rounded-md bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{{ guardando ? 'Guardando...' : 'Registrar' }}</button>
            <p v-if="errorFormulario" class="text-sm text-red-700">{{ errorFormulario }}</p>
          </div>
        </form>
      </section>

      <section class="overflow-hidden rounded-lg bg-white shadow">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <h2 class="text-lg font-semibold">{{ usuarios.length }} usuarios</h2>
          <button @click="cargar" class="text-sm font-semibold text-red-700 hover:text-red-900">Actualizar</button>
        </div>
        <p v-if="cargando" class="p-6 text-gray-500">Cargando usuarios...</p>
        <p v-else-if="error" class="p-6 text-red-700">{{ error }}</p>
        <div v-else class="overflow-x-auto">
          <table class="w-full min-w-[760px] text-left">
            <thead class="bg-gray-50"><tr><th class="px-6 py-3">Usuario</th><th class="px-6 py-3">Correo</th><th class="px-6 py-3">Rol</th><th class="px-6 py-3">Estado</th><th class="px-6 py-3 text-right">Acciones</th></tr></thead>
            <tbody class="divide-y">
              <tr v-for="usuario in usuarios" :key="usuario.id" class="hover:bg-red-50/30">
                <td class="px-6 py-4"><strong>{{ usuario.nombre }} {{ usuario.apellido }}</strong><small class="block text-gray-500">{{ usuario.correo }}</small></td>
                <td class="px-6 py-4 text-gray-600">{{ usuario.correo }}</td>
                <td class="px-6 py-4"><select :value="rolPrincipal(usuario)" @change="cambiarRol(usuario, $event.target.value)" class="rounded border px-2 py-1 text-sm"><option value="USER">Usuario</option><option value="ADMIN">Administrador</option></select></td>
                <td class="px-6 py-4"><span :class="usuario.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'" class="rounded-full px-2 py-1 text-xs font-semibold">{{ usuario.activo ? 'Activo' : 'Inactivo' }}</span></td>
                <td class="px-6 py-4 text-right"><button v-if="usuario.activo" @click="desactivar(usuario)" class="text-sm font-semibold text-red-700 hover:text-red-900">Desactivar</button><button v-else @click="activar(usuario)" class="text-sm font-semibold text-green-700 hover:text-green-900">Activar</button></td>
              </tr>
              <tr v-if="!usuarios.length"><td colspan="5" class="px-6 py-10 text-center text-gray-500">No hay usuarios registrados.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import api from '../services/api'

const usuarios = ref([])
const cargando = ref(false)
const guardando = ref(false)
const error = ref('')
const errorFormulario = ref('')
const mostrarFormulario = ref(false)
const formulario = ref({ username: '', nombre: '', apellido: '', correo: '', password: '', rol: 'USER' })

const mensajeError = (err, fallback) => err.response?.data?.error || err.response?.data?.message || fallback
const rolPrincipal = (usuario) => usuario.roles?.includes('ADMIN') ? 'ADMIN' : 'USER'

async function cargar() {
  cargando.value = true
  error.value = ''
  try { usuarios.value = (await api.get('/api/admin/usuarios')).data || [] } catch (err) { error.value = mensajeError(err, 'No se pudieron cargar los usuarios.') } finally { cargando.value = false }
}

async function registrar() {
  guardando.value = true
  errorFormulario.value = ''
  try {
    await api.post('/api/admin/usuarios/registrar', formulario.value)
    formulario.value = { username: '', nombre: '', apellido: '', correo: '', password: '', rol: 'USER' }
    mostrarFormulario.value = false
    await cargar()
  } catch (err) { errorFormulario.value = mensajeError(err, 'No se pudo registrar el usuario.') } finally { guardando.value = false }
}

async function cambiarRol(usuario, rol) {
  try { await api.patch(`/api/admin/usuarios/${usuario.id}/roles`, null, { params: { rol } }); await cargar() } catch (err) { error.value = mensajeError(err, 'No se pudo actualizar el rol.'); await cargar() }
}

async function desactivar(usuario) {
  if (!window.confirm(`¿Desactivar a ${usuario.nombre} ${usuario.apellido}?`)) return
  try { await api.delete(`/api/admin/usuarios/${usuario.id}`); await cargar() } catch (err) { error.value = mensajeError(err, 'No se pudo desactivar el usuario.') }
}

async function activar(usuario) {
  try { await api.patch(`/api/admin/usuarios/${usuario.id}/activar`); await cargar() } catch (err) { error.value = mensajeError(err, 'No se pudo activar el usuario.') }
}

onMounted(cargar)
</script>
