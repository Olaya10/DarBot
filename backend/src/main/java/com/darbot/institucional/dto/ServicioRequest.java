package com.darbot.institucional.dto;

import jakarta.validation.constraints.NotBlank;

public record ServicioRequest(
        @NotBlank String nombre,
        String descripcion,
        String horario,
        @NotBlank String icono,
        Integer orden,
        Boolean activo
) {}
