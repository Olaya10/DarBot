package com.darbot.galeria.dto;

import java.time.LocalDateTime;

public record GalleryItemResponse(
    Long id,
    String titulo,
    String descripcion,
    LocalDateTime fecha,
    String urlImagen
) {
    public static GalleryItemResponse from(com.darbot.galeria.entity.GalleryItem item) {
        return new GalleryItemResponse(
            item.getId(),
            item.getTitulo(),
            item.getDescripcion(),
            item.getFecha(),
            item.getUrlImagen()
        );
    }
}
