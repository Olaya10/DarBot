package com.darbot.publico.dto;

import jakarta.validation.constraints.NotBlank;

public record ValorInstitucionalRequest(
        @NotBlank String icono,
        @NotBlank String titulo,
        String descripcion,
        Integer orden,
        Boolean activo
) {}
