package com.darbot.publico.dto;

import com.darbot.galeria.entity.GalleryItem;

public record GaleriaResponse(
        Long id,
        String titulo,
        String descripcion,
        String categoria,
        String imagenUrl,
        Integer orden,
        Boolean destacado
) {
    public static GaleriaResponse from(GalleryItem entity) {
        return new GaleriaResponse(
                entity.getId(),
                entity.getTitulo(),
                entity.getDescripcion(),
                entity.getCategoria(),
                entity.getUrlImagen(),
                entity.getOrden(),
                entity.getDestacado()
        );
    }
}
