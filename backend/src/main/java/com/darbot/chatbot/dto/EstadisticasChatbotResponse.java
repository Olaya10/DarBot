package com.darbot.chatbot.dto;

import java.util.List;

public record EstadisticasChatbotResponse(
        Long totalConversaciones,
        Long totalMensajes,
        Long mensajesUsuario,
        Long mensajesBot,
        Long preguntasSinRespuesta,
        Long totalFeedback,
        Long feedbackPositivo,
        Long feedbackNegativo,
        Double porcentajeExito,
        Double promedioMensajesPorConversacion,
        List<IntencionTop> topIntenciones,
        List<ActividadDia> actividadUltimos7Dias,
        List<PreguntaPendiente> preguntasPendientes
) {
    public record IntencionTop(String intencion, Long total, Double porcentaje) {}
    public record ActividadDia(String dia, Long mensajes) {}
    public record PreguntaPendiente(Long id, String pregunta, String fecha) {}
}
