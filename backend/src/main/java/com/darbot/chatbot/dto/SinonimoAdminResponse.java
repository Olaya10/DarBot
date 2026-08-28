package com.darbot.chatbot.dto;

import com.darbot.chatbot.entity.Sinonimo;

public record SinonimoAdminResponse(
        Long id,
        String palabraBase,
        String sinonimo,
        Long intencionId,
        String intencionNombre,
        Boolean activa
) {
    public static SinonimoAdminResponse from(Sinonimo sinonimo) {
        return new SinonimoAdminResponse(
                sinonimo.getId(),
                sinonimo.getPalabraBase(),
                sinonimo.getSinonimo(),
                sinonimo.getIntencion() == null ? null : sinonimo.getIntencion().getId(),
                sinonimo.getIntencion() == null ? null : sinonimo.getIntencion().getNombre(),
                sinonimo.getActiva()
        );
    }
}