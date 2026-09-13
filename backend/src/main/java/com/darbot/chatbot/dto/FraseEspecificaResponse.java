package com.darbot.chatbot.dto;

import com.darbot.chatbot.entity.FraseEspecifica;

public record FraseEspecificaResponse(
        Long id,
        String frase,
        Long intencionId,
        String intencionNombre,
        Boolean activa,
        Integer peso
) {
    public static FraseEspecificaResponse from(FraseEspecifica frase) {
        return new FraseEspecificaResponse(
                frase.getId(),
                frase.getFrase(),
                frase.getIntencion() != null ? frase.getIntencion().getId() : null,
                frase.getIntencion() != null ? frase.getIntencion().getNombre() : null,
                frase.getActiva(),
                frase.getPeso()
        );
    }
}
