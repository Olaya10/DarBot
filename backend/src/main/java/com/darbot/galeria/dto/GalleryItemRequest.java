package com.darbot.galeria.dto;

import java.time.LocalDateTime;

public record GalleryItemRequest(
    String titulo,
    String descripcion,
    LocalDateTime fecha,
    String categoria,
    Integer orden,
    Boolean activo,
    Boolean destacado
) {}
