package com.darbot.chatbot.service;

import com.darbot.chatbot.entity.Conversacion;
import com.darbot.chatbot.entity.FeedbackChatbot;
import com.darbot.chatbot.entity.Mensaje;
import com.darbot.chatbot.repository.ConversacionRepository;
import com.darbot.chatbot.repository.FeedbackChatbotRepository;
import com.darbot.chatbot.repository.MensajeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.darbot.common.exception.BadRequestException;
import com.darbot.common.exception.ResourceNotFoundException;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackService {

    private final FeedbackChatbotRepository feedbackRepository;
    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;

    @Transactional
    public void registrarFeedback(String sessionId, Long mensajeId, Integer calificacion, 
                                   String comentario, String ip, String userAgent) {
        
        // Verificar calificación válida
        if (calificacion == null || (!calificacion.equals(1) && !calificacion.equals(-1))) {
            throw new BadRequestException("La calificación debe ser 1 (útil) o -1 (no útil)");
        }

        // Buscar conversación
        Conversacion conversacion = conversacionRepository.findBySessionId(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Conversación no encontrada"));

        // Buscar mensaje (opcional)
        Mensaje mensaje = null;
        if (mensajeId != null) {
            mensaje = mensajeRepository.findById(mensajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Mensaje no encontrado"));
            if (!mensaje.getConversacion().getId().equals(conversacion.getId())) {
                throw new BadRequestException("El mensaje no pertenece a la conversación indicada");
            }
        }

        // Crear feedback
        FeedbackChatbot feedback = new FeedbackChatbot();
        feedback.setConversacion(conversacion);
        feedback.setMensaje(mensaje);
        feedback.setCalificacion(calificacion);
        feedback.setComentario(comentario);
        feedback.setIp(ip);
        feedback.setUserAgent(userAgent);

        feedbackRepository.save(feedback);
        log.info("Feedback registrado: sessionId={}, calificacion={}", sessionId, calificacion);
    }

    public Map<String, Object> obtenerEstadisticas() {
        Map<String, Object> estadisticas = new HashMap<>();

        long totalPositivos = feedbackRepository.countPositivos();
        long totalNegativos = feedbackRepository.countNegativos();
        long total = totalPositivos + totalNegativos;

        estadisticas.put("total_feedback", total);
        estadisticas.put("positivos", totalPositivos);
        estadisticas.put("negativos", totalNegativos);
        estadisticas.put("tasa_aprobacion", total > 0 ? (double) totalPositivos / total * 100 : 0);

        // Últimos 7 días
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime hace7Dias = ahora.minusDays(7);
        List<Object[]> ultimos7Dias = feedbackRepository.countByFechaBetween(hace7Dias, ahora);
        
        Map<String, Map<String, Long>> diario = new HashMap<>();
        
        for (Object[] row : ultimos7Dias) {
            String fecha = row[0] != null ? row[0].toString() : "";
            Long positivos = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            Long negativos = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            
            Map<String, Long> dia = new HashMap<>();
            dia.put("positivos", positivos);
            dia.put("negativos", negativos);
            diario.put(fecha, dia);
        }
        
        estadisticas.put("ultimos_7_dias", diario);

        return estadisticas;
    }
}
