package com.darbot.publico.dto;

import com.darbot.publico.entity.Galeria;

public record GaleriaResponse(
        Long id,
        String titulo,
        String descripcion,
        String categoria,
        String imagenUrl,
        Integer orden,
        Boolean destacado
) {
    public static GaleriaResponse from(Galeria entity) {
        return new GaleriaResponse(
                entity.getId(),
                entity.getTitulo(),
                entity.getDescripcion(),
                entity.getCategoria(),
                entity.getImagenUrl(),
                entity.getOrden(),
                entity.getDestacado()
        );
    }
}
