package com.darbot.chatbot.service;

import com.darbot.chatbot.dto.ChatbotRespuesta;
import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.chatbot.entity.Conversacion;
import com.darbot.chatbot.entity.Mensaje;
import com.darbot.chatbot.repository.ConversacionRepository;
import com.darbot.chatbot.repository.MensajeRepository;
import com.darbot.chatbot.util.LenguajeUtil;
import com.darbot.common.exception.BadRequestException;
import com.darbot.common.exception.ChatbotException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final IntentRouterService intentRouterService;
    private final LenguajeUtil lenguajeUtil;
    private final ContextoService contextoService;
    private final CacheService cacheService;

    // Cache de respuestas para preguntas frecuentes
    public ChatbotRespuesta procesarMensajeConCache(String sessionId, String textoUsuario) {
        return procesarMensaje(sessionId, textoUsuario);
    }

    public ChatbotRespuesta procesarMensaje(String sessionId, String textoUsuario) {
        validarEntrada(sessionId, textoUsuario);

        try {
            // Verificar si la respuesta está en cache
            ChatbotRespuesta cached = cacheService.obtenerRespuestaCache(sessionId, textoUsuario);
            if (cached != null) {
                log.info("Respuesta obtenida de cache: sessionId={}", sessionId);
                return cached;
            }

            Conversacion conversacion = obtenerOCrearConversacion(sessionId);
            guardarMensaje(conversacion, "USER", textoUsuario);

            String textoNormalizado = lenguajeUtil.normalizar(textoUsuario);
            log.info("Texto normalizado: '{}'", textoNormalizado);

            ResultadoChatbot resultado;

            // Verificar pregunta compuesta
            if (lenguajeUtil.esPreguntaCompuesta(textoNormalizado)) {
                resultado = intentRouterService.procesarPreguntaCompuesta(textoNormalizado);
            } else {
                resultado = intentRouterService.procesar(textoNormalizado, conversacion);
            }

            // Guardar respuesta BOT
            Mensaje mensajeBot = guardarMensajeConIntencion(conversacion, "BOT", resultado.getMensaje(), resultado.getIntencion());

            // Actualizar contexto
            contextoService.actualizarContexto(
                conversacion,
                resultado.getIntencion(),
                null,
                textoUsuario,
                resultado.getMensaje()
            );

            // Construir respuesta
            ChatbotRespuesta respuesta = construirRespuestaEstructurada(resultado, mensajeBot.getId());

            // Guardar en cache para futuras consultas

            return respuesta;

        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Error procesando mensaje", ex);
            throw new ChatbotException("No se pudo procesar el mensaje del chatbot", ex);
        }
    }

    private ChatbotRespuesta construirRespuestaEstructurada(ResultadoChatbot resultado, Long mensajeId) {
        ChatbotRespuesta respuestaDTO = new ChatbotRespuesta();
        respuestaDTO.setRespuesta(resultado.getMensaje());
        respuestaDTO.setIntencion(resultado.getIntencion());
        respuestaDTO.setEntidades(new HashMap<>());
        respuestaDTO.setMensajeId(mensajeId); // Agregar mensajeId
        
        // Opciones según intención
        if (resultado.getOpciones() != null && !resultado.getOpciones().isEmpty()) {
            respuestaDTO.setOpciones(resultado.getOpciones());
        } else {
            // Opciones por defecto
            switch (resultado.getIntencion()) {
                case "CONSULTAR_EVENTOS":
                    respuestaDTO.setOpciones(java.util.Arrays.asList("Ver todos los eventos", "Ver eventos por mes"));
                    break;
                case "CONSULTAR_NOTICIAS":
                    respuestaDTO.setOpciones(java.util.Arrays.asList("Ver todas las noticias", "Ver noticias por categoría"));
                    break;
                case "CONSULTAR_DOCUMENTOS":
                    respuestaDTO.setOpciones(java.util.Arrays.asList("Ver todos los documentos", "Buscar documentos"));
                    break;
            }
        }
        
        return respuestaDTO;
    }

    private void validarEntrada(String sessionId, String textoUsuario) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new BadRequestException("sessionId es obligatorio");
        }
        if (textoUsuario == null || textoUsuario.isBlank()) {
            throw new BadRequestException("El texto del usuario no puede estar vacío");
        }
    }

    private Conversacion obtenerOCrearConversacion(String sessionId) {
        return conversacionRepository.findBySessionId(sessionId)
                .orElseGet(() -> {
                    Conversacion nuevaConv = new Conversacion();
                    nuevaConv.setSessionId(sessionId);
                    nuevaConv.setEstado("ACTIVA");
                    return conversacionRepository.save(nuevaConv);
                });
    }

    private void guardarMensaje(Conversacion conversacion, String tipo, String contenido) {
        Mensaje mensaje = new Mensaje();
        mensaje.setConversacion(conversacion);
        mensaje.setTipo(tipo);
        mensaje.setContenido(contenido);
        mensajeRepository.save(mensaje);
    }

    private Mensaje guardarMensajeConIntencion(Conversacion conversacion, String tipo, String contenido, String intencion) {
        Mensaje mensaje = new Mensaje();
        mensaje.setConversacion(conversacion);
        mensaje.setTipo(tipo);
        mensaje.setContenido(contenido);
        mensaje.setIntencionDetectada(intencion);
        return mensajeRepository.save(mensaje);
    }
}