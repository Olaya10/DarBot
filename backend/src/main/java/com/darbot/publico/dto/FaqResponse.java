package com.darbot.publico.dto;

import com.darbot.chatbot.entity.Faq;

public record FaqResponse(
        Long id,
        String pregunta,
        String respuesta,
        String categoria
) {
    public static FaqResponse from(Faq entity) {
        return new FaqResponse(
                entity.getId(),
                entity.getPregunta(),
                entity.getRespuesta(),
                entity.getCategoria()
        );
    }
}
