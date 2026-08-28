package com.darbot.chatbot.dto;

import com.darbot.chatbot.entity.PreguntaSinRespuesta;

import java.time.LocalDateTime;

public record PreguntaSinRespuestaResponse(
        Long id,
        String pregunta,
        LocalDateTime fecha,
        String intentoIntencion,
        Boolean resuelta
) {
    public static PreguntaSinRespuestaResponse from(PreguntaSinRespuesta pregunta) {
        return new PreguntaSinRespuestaResponse(
                pregunta.getId(),
                pregunta.getPregunta(),
                pregunta.getFecha(),
                pregunta.getIntentoIntencion(),
                pregunta.getResuelta()
        );
    }
}