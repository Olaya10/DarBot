import { defineStore } from 'pinia'
import { ref } from 'vue'
import { chatbotService } from '../services/chatbot'

export const useChatbotStore = defineStore('chatbot', () => {
  const mensajes = ref([])
  const loading = ref(false)
  const sessionId = ref('session-' + Date.now())

  function esperar(milisegundos) {
    return new Promise((resolve) => window.setTimeout(resolve, milisegundos))
  }

  async function escribirRespuesta(mensaje, respuesta) {
    for (let indice = 0; indice < respuesta.length; indice += 1) {
      mensaje.contenido += respuesta[indice]
      await esperar(respuesta[indice] === ' ' ? 18 : 24)
    }
  }

  async function enviarMensaje(texto) {
    if (!texto || !texto.trim()) return
    
    mensajes.value.push({
      id: Date.now(),
      tipo: 'USER',
      contenido: texto,
      fecha: new Date()
    })

    loading.value = true

    try {
      const response = await chatbotService.enviarPregunta(sessionId.value, texto)
      
      const mensajeBot = {
        id: response.mensajeId || Date.now() + 1,
        tipo: 'BOT',
        contenido: '',
        intencion: response.intencion,
        opciones: response.opciones,
        fecha: new Date()
      }
      mensajes.value.push(mensajeBot)
      loading.value = false
      void escribirRespuesta(mensajeBot, response.respuesta || '')
      
      return response
    } catch (error) {
      mensajes.value.push({
        id: Date.now() + 1,
        tipo: 'BOT',
        contenido: '❌ Lo siento, hubo un error al procesar tu mensaje.',
        fecha: new Date()
      })
      throw error
    } finally {
      loading.value = false
    }
  }

  async function enviarFeedback(mensajeId, calificacion, comentario) {
    try {
      await chatbotService.enviarFeedback(sessionId.value, mensajeId, calificacion, comentario)
      return true
    } catch (error) {
      console.error('Error enviando feedback:', error)
      return false
    }
  }

  function limpiarChat() {
    mensajes.value = []
    sessionId.value = 'session-' + Date.now()
  }

  return {
    mensajes,
    loading,
    sessionId,
    enviarMensaje,
    enviarFeedback,
    limpiarChat
  }
})
