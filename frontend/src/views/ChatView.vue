<template>
  <div class="admin-view with-shared-sidebar chat-admin-view">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <router-link to="/dashboard" class="text-gray-600 hover:text-gray-800">
            ← Volver
          </router-link>
          <h1 class="text-xl font-bold text-red-700">💬 Chat con DarBot</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600 text-sm">{{ authStore.user?.username }}</span>
          <router-link to="/" class="text-red-700 text-sm font-medium">Ver sitio</router-link>
          <button 
            @click="authStore.logout" 
            class="text-red-500 hover:text-red-700 text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>

    <!-- Chat -->
    <main class="max-w-4xl mx-auto px-4 py-8">
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <!-- Mensajes -->
        <div ref="chatContainer" class="h-[500px] overflow-y-auto p-4 space-y-3">
          <!-- Mensaje de bienvenida -->
          <div v-if="chatStore.mensajes.length === 0" class="text-center text-gray-500 py-10">
            <p class="text-2xl mb-2">🤖</p>
            <p>¡Hola! Soy DarBot, tu asistente virtual.</p>
            <p class="text-sm">Pregúntame sobre eventos, noticias, horarios y más.</p>
          </div>

          <!-- Mensajes -->
          <div v-for="msg in chatStore.mensajes" :key="msg.id" class="flex" :class="msg.tipo === 'USER' ? 'justify-end' : 'justify-start'">
            <div 
              class="max-w-[80%] rounded-lg px-4 py-2"
              :class="msg.tipo === 'USER' 
                ? 'bg-red-600 text-white rounded-br-none' 
                : 'bg-gray-200 text-gray-800 rounded-bl-none'"
            >
              <div class="whitespace-pre-wrap">{{ msg.contenido }}</div>
              
              <!-- Opciones -->
              <div v-if="msg.opciones && msg.opciones.length > 0" class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="(opcion, idx) in msg.opciones"
                  :key="idx"
                  @click="handleOpcion(opcion)"
                  class="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full transition-colors"
                  :class="msg.tipo === 'USER' ? 'text-white' : 'text-red-700 bg-red-50 hover:bg-red-100'"
                >
                  {{ opcion }}
                </button>
              </div>
              
              <!-- Feedback -->
              <div v-if="msg.tipo === 'BOT' && msg.id" class="mt-2 flex items-center gap-2">
                <button 
                  @click="sendFeedback(msg.id, 1)" 
                  class="text-xs hover:scale-110 transition-transform"
                  :class="msg.tipo === 'USER' ? 'text-white/70' : 'text-gray-500'"
                >
                  👍
                </button>
                <button 
                  @click="sendFeedback(msg.id, -1)" 
                  class="text-xs hover:scale-110 transition-transform"
                  :class="msg.tipo === 'USER' ? 'text-white/70' : 'text-gray-500'"
                >
                  👎
                </button>
                <span v-if="msg.feedbackEnviado" class="text-[10px] text-green-500">✅</span>
              </div>
              
              <div class="text-[10px] mt-1 opacity-50" :class="msg.tipo === 'USER' ? 'text-white' : 'text-gray-500'">
                {{ formatFecha(msg.fecha) }}
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="chatStore.loading" class="flex justify-start">
            <div class="bg-gray-200 rounded-lg px-4 py-2 rounded-bl-none">
              <div class="flex gap-1">
                <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0s"></span>
                <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                <span class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
              </div>
            </div>
          </div>
        </div>

        <!-- Input -->
        <div class="border-t p-4">
          <form @submit.prevent="enviarMensaje" class="flex gap-2">
            <input
              ref="mensajeInputEl"
              v-model="mensajeInput"
              type="text"
              placeholder="Escribe tu mensaje..."
              class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              :disabled="chatStore.loading"
            />
            <button
              type="submit"
              class="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              :disabled="!mensajeInput.trim() || chatStore.loading"
            >
              Enviar
            </button>
            <button
              type="button"
              @click="chatStore.limpiarChat()"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ✕
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useChatbotStore } from '../stores/chatbot'

const authStore = useAuthStore()
const chatStore = useChatbotStore()

const mensajeInput = ref('')
const chatContainer = ref(null)
const mensajeInputEl = ref(null)

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

async function enviarMensaje() {
  if (!mensajeInput.value.trim()) return
  
  const texto = mensajeInput.value
  mensajeInput.value = ''
  
  await chatStore.enviarMensaje(texto)
  
  await nextTick()
  scrollToBottom()
  mensajeInputEl.value?.focus()
}

function handleOpcion(opcion) {
  mensajeInput.value = opcion
  enviarMensaje()
}

async function sendFeedback(mensajeId, calificacion) {
  const success = await chatStore.enviarFeedback(mensajeId, calificacion, '')
  if (success) {
    // Marcar el mensaje como feedback enviado
    const msg = chatStore.mensajes.find(m => m.id === mensajeId)
    if (msg) {
      msg.feedbackEnviado = true
    }
  }
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

onMounted(() => {
  scrollToBottom()
  mensajeInputEl.value?.focus()
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
