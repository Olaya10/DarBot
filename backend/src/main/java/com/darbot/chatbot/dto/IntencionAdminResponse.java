package com.darbot.chatbot.dto;

import com.darbot.chatbot.entity.Intencion;

import java.util.List;

public record IntencionAdminResponse(
        Long id,
        String nombre,
        String descripcion,
        Boolean activa,
        Integer prioridad,
        String respuestaPorDefecto,
        List<PalabraClaveResponse> palabrasClave
) {
    public static IntencionAdminResponse from(Intencion intencion) {
        return new IntencionAdminResponse(
                intencion.getId(),
                intencion.getNombre(),
                intencion.getDescripcion(),
                intencion.getActiva(),
                intencion.getPrioridad(),
                intencion.getRespuestaPorDefecto(),
                intencion.getPalabrasClave().stream().map(PalabraClaveResponse::from).toList()
        );
    }
}