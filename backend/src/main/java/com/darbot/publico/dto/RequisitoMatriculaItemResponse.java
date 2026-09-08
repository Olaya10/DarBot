package com.darbot.publico.dto;

import com.darbot.publico.entity.RequisitoMatriculaItem;

public record RequisitoMatriculaItemResponse(
        Long id,
        String texto,
        Integer orden
) {
    public static RequisitoMatriculaItemResponse from(RequisitoMatriculaItem entity) {
        return new RequisitoMatriculaItemResponse(
                entity.getId(),
                entity.getTexto(),
                entity.getOrden()
        );
    }
}
