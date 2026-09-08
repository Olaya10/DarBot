package com.darbot.publico.dto;

import com.darbot.publico.entity.RequisitoMatricula;

import java.util.List;

public record RequisitoMatriculaResponse(
        Long id,
        String nivel,
        String titulo,
        String descripcion,
        Integer orden,
        List<RequisitoMatriculaItemResponse> items
) {
    public static RequisitoMatriculaResponse from(RequisitoMatricula entity, List<RequisitoMatriculaItemResponse> items) {
        return new RequisitoMatriculaResponse(
                entity.getId(),
                entity.getNivel(),
                entity.getTitulo(),
                entity.getDescripcion(),
                entity.getOrden(),
                items
        );
    }
}
