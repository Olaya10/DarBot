<template>
  <div ref="chatWidget" class="fixed bottom-6 right-6 z-50">
    <!-- Botón flotante -->
    <button
      v-if="!abierto"
      @click="abrirChat"
      class="chat-fab w-14 h-14 text-white rounded-full shadow-lg transition-all hover:scale-105 flex items-center justify-center text-2xl"
    >
      💬
    </button>

    <!-- Ventana del chat -->
    <div
      v-else
      class="chat-window bg-white rounded-2xl shadow-2xl w-[calc(100vw-2rem)] max-w-96 h-[min(600px,calc(100vh-2rem))] min-h-96 flex flex-col overflow-hidden border border-gray-200"
    >
      <!-- Header -->
      <div class="chat-header text-white p-4 flex justify-between items-center">
        <div>
          <h3 class="font-bold">🤖 DarBot</h3>
          <p class="text-xs text-red-100">Asistente virtual</p>
        </div>
        <div class="flex gap-2">
          <button @click="limpiarChat" class="text-white/70 hover:text-white text-sm" title="Limpiar chat">
            🗑️
          </button>
          <button @click="cerrarChat" class="text-white/70 hover:text-white text-lg">
            ✕
          </button>
        </div>
      </div>

      <!-- Mensajes -->
      <div ref="chatContainer" class="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        <div v-if="chatStore.mensajes.length === 0" class="text-center text-gray-500 py-10">
          <p class="text-2xl mb-2">🤖</p>
          <p class="text-sm">¡Hola! Soy DarBot</p>
          <p class="text-xs">¿En qué puedo ayudarte?</p>
        </div>

        <div v-for="msg in chatStore.mensajes" :key="msg.id" class="flex" :class="msg.tipo === 'USER' ? 'justify-end' : 'justify-start'">
          <div 
            class="max-w-[85%] rounded-lg px-4 py-2 text-sm"
            :class="msg.tipo === 'USER' 
              ? 'bg-red-600 text-white rounded-br-none' 
              : 'bg-white text-gray-800 rounded-bl-none shadow-sm'"
          >
            <div class="whitespace-pre-wrap">{{ msg.contenido }}</div>
            
            <div v-if="msg.opciones && msg.opciones.length > 0" class="mt-2 flex flex-wrap gap-1">
              <button
                v-for="(opcion, idx) in msg.opciones"
                :key="idx"
                @click="handleOpcion(opcion)"
                class="text-xs px-2 py-1 rounded-full transition-colors"
                :class="msg.tipo === 'USER' 
                  ? 'bg-white/20 hover:bg-white/30 text-white' 
                  : 'bg-red-50 hover:bg-red-100 text-red-700'"
              >
                {{ opcion }}
              </button>
            </div>

            <div class="text-[10px] mt-1 opacity-50" :class="msg.tipo === 'USER' ? 'text-white/70' : 'text-gray-400'">
              {{ formatFecha(msg.fecha) }}
            </div>
          </div>
        </div>

        <div v-if="chatStore.loading" class="flex justify-start">
          <div class="bg-white rounded-lg px-4 py-2 rounded-bl-none shadow-sm">
            <div class="flex gap-1">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="border-t p-3 bg-white">
        <form @submit.prevent="enviarMensaje" class="flex gap-2">
            <input
              ref="mensajeInputEl"
            v-model="mensajeInput"
            type="text"
            placeholder="Escribe un mensaje..."
              class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            :disabled="chatStore.loading"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            :disabled="!mensajeInput.trim() || chatStore.loading"
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useChatbotStore } from '../../stores/chatbot'

const chatStore = useChatbotStore()
const abierto = ref(false)
const mensajeInput = ref('')
const chatContainer = ref(null)
const mensajeInputEl = ref(null)
const chatWidget = ref(null)

function formatFecha(fecha) {
  if (!fecha) return ''
  const d = new Date(fecha)
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function abrirChat() {
  abierto.value = true
  nextTick(() => { scrollToBottom(); mensajeInputEl.value?.focus() })
}

function cerrarChat() {
  abierto.value = false
}

function cerrarConEscape(evento) {
  if (evento.key === 'Escape' && abierto.value) cerrarChat()
}

function cerrarAlHacerClickFuera(evento) {
  if (abierto.value && chatWidget.value && !chatWidget.value.contains(evento.target)) cerrarChat()
}

function limpiarChat() {
  chatStore.limpiarChat()
}

async function enviarMensaje() {
  if (!mensajeInput.value.trim()) return
  
  const texto = mensajeInput.value
  mensajeInput.value = ''
  
  await chatStore.enviarMensaje(texto)
  nextTick(() => { scrollToBottom(); mensajeInputEl.value?.focus() })
}

function handleOpcion(opcion) {
  mensajeInput.value = opcion
  enviarMensaje()
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// Scroll cuando hay nuevos mensajes
watch(() => chatStore.mensajes.map((mensaje) => mensaje.contenido).join(''), () => {
  nextTick(() => scrollToBottom())
})

onMounted(() => {
  document.addEventListener('keydown', cerrarConEscape)
  document.addEventListener('pointerdown', cerrarAlHacerClickFuera)
})

onUnmounted(() => {
  document.removeEventListener('keydown', cerrarConEscape)
  document.removeEventListener('pointerdown', cerrarAlHacerClickFuera)
})
</script>

<style scoped>
.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}

.chat-fab, .chat-header { background: #d9363e; }
.chat-fab:hover { background: #b92530; }
.chat-window { animation: chat-in .2s ease-out; }

@keyframes chat-in {
  from { opacity: 0; transform: translateY(8px) scale(.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}
</style>
