package com.darbot.galeria.dto;

import java.time.LocalDateTime;

public record GalleryItemResponse(
    Long id,
    String titulo,
    String descripcion,
    LocalDateTime fecha,
    String urlImagen,
    String categoria,
    Integer orden,
    Boolean activo,
    Boolean destacado
) {
    public static GalleryItemResponse from(com.darbot.galeria.entity.GalleryItem item) {
        return new GalleryItemResponse(
            item.getId(),
            item.getTitulo(),
            item.getDescripcion(),
            item.getFecha(),
            item.getUrlImagen(),
            item.getCategoria(),
            item.getOrden(),
            item.getActivo(),
            item.getDestacado()
        );
    }
}
