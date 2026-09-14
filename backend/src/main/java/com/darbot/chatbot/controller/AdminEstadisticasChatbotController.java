package com.darbot.chatbot.controller;

import com.darbot.chatbot.dto.EstadisticasChatbotResponse;
import com.darbot.chatbot.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/chatbot")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Slf4j
public class AdminEstadisticasChatbotController {

    private final ConversacionRepository conversacionRepository;
    private final MensajeRepository mensajeRepository;
    private final PreguntaSinRespuestaRepository preguntaRepository;
    private final FeedbackChatbotRepository feedbackRepository;
    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/estadisticas")
    public ResponseEntity<EstadisticasChatbotResponse> obtenerEstadisticas() {
        // Contadores básicos
        long totalConversaciones = conversacionRepository.count();
        long totalMensajes = mensajeRepository.count();
        long preguntasSinRespuesta = preguntaRepository.findAll().stream()
                .filter(p -> !p.getResuelta()).count();
        long totalFeedback = feedbackRepository.count();
        
        // Feedback positivo/negativo
        long feedbackPositivo = feedbackRepository.findAll().stream()
                .filter(f -> f.getCalificacion() != null && f.getCalificacion() == 1).count();
        long feedbackNegativo = feedbackRepository.findAll().stream()
                .filter(f -> f.getCalificacion() != null && f.getCalificacion() == -1).count();

        // Porcentaje de éxito (1 - (sin respuesta / total mensajes usuario))
        long mensajesUsuario = 0;
        long mensajesBot = 0;
        try {
            mensajesUsuario = mensajeRepository.findAll().stream()
                    .filter(m -> m.getTipo() != null && 
                        (m.getTipo().equalsIgnoreCase("USUARIO") || 
                         m.getTipo().equalsIgnoreCase("USER") ||
                         m.getTipo().equalsIgnoreCase("USUARIO") ||
                         m.getTipo().toUpperCase().contains("USER"))).count();
            mensajesBot = mensajeRepository.findAll().stream()
                    .filter(m -> m.getTipo() != null && 
                        (m.getTipo().equalsIgnoreCase("BOT") ||
                         m.getTipo().equalsIgnoreCase("ASISTENTE") ||
                         m.getTipo().toUpperCase().contains("BOT"))).count();
        } catch (Exception e) {
            log.warn("Error calculando mensajes: {}", e.getMessage());
        }

        long totalMensajesUsuario = mensajesUsuario > 0 ? mensajesUsuario : (totalMensajes / 2);
        double porcentajeExito = totalMensajesUsuario > 0 
            ? Math.round((1.0 - (double) preguntasSinRespuesta / totalMensajesUsuario) * 10000.0) / 100.0
            : 100.0;
        if (porcentajeExito > 100.0) porcentajeExito = 100.0;
        if (porcentajeExito < 0.0) porcentajeExito = 0.0;
        
        double promedioMensajes = totalConversaciones > 0 
            ? Math.round((double) totalMensajes / totalConversaciones * 100.0) / 100.0
            : 0.0;

        // Top 10 intenciones
        List<EstadisticasChatbotResponse.IntencionTop> topIntenciones = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT intencion_detectada, COUNT(*) AS total " +
                "FROM mensajes WHERE intencion_detectada IS NOT NULL " +
                "GROUP BY intencion_detectada ORDER BY total DESC LIMIT 10"
            );
            long totalConIntencion = rows.stream()
                    .mapToLong(r -> ((Number) r.get("total")).longValue()).sum();
            
            for (Map<String, Object> row : rows) {
                String intencion = (String) row.get("intencion_detectada");
                long total = ((Number) row.get("total")).longValue();
                double porcentaje = totalConIntencion > 0 
                    ? Math.round(total * 10000.0 / totalConIntencion) / 100.0
                    : 0.0;
                topIntenciones.add(new EstadisticasChatbotResponse.IntencionTop(intencion, total, porcentaje));
            }
        } catch (Exception e) {
            log.warn("Error calculando top intenciones: {}", e.getMessage());
        }

        // Actividad últimos 7 días
        List<EstadisticasChatbotResponse.ActividadDia> actividad = new ArrayList<>();
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT DATE(fecha) AS dia, COUNT(*) AS total " +
                "FROM mensajes WHERE fecha >= NOW() - INTERVAL '7 days' " +
                "GROUP BY DATE(fecha) ORDER BY dia ASC"
            );
            for (Map<String, Object> row : rows) {
                String dia = row.get("dia").toString();
                long total = ((Number) row.get("total")).longValue();
                actividad.add(new EstadisticasChatbotResponse.ActividadDia(dia, total));
            }
        } catch (Exception e) {
            log.warn("Error calculando actividad: {}", e.getMessage());
        }

        // Preguntas pendientes (últimas 10)
        List<EstadisticasChatbotResponse.PreguntaPendiente> pendientes = new ArrayList<>();
        try {
            preguntaRepository.findAll().stream()
                    .filter(p -> !p.getResuelta())
                    .sorted((a, b) -> {
                        if (a.getFecha() == null) return 1;
                        if (b.getFecha() == null) return -1;
                        return b.getFecha().compareTo(a.getFecha());
                    })
                    .limit(10)
                    .forEach(p -> {
                        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
                        String fechaStr = p.getFecha() != null ? p.getFecha().format(fmt) : "";
                        pendientes.add(new EstadisticasChatbotResponse.PreguntaPendiente(
                                p.getId(), p.getPregunta(), fechaStr));
                    });
        } catch (Exception e) {
            log.warn("Error calculando pendientes: {}", e.getMessage());
        }

        EstadisticasChatbotResponse response = new EstadisticasChatbotResponse(
                totalConversaciones,
                totalMensajes,
                mensajesUsuario,
                mensajesBot,
                preguntasSinRespuesta,
                totalFeedback,
                feedbackPositivo,
                feedbackNegativo,
                porcentajeExito,
                promedioMensajes,
                topIntenciones,
                actividad,
                pendientes
        );

        return ResponseEntity.ok(response);
    }
}
