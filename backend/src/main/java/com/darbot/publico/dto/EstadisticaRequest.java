package com.darbot.publico.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record EstadisticaRequest(
        @NotBlank String label,
        @NotNull Integer value,
        String sufijo,
        String icono,
        Integer orden,
        Boolean activo
) {}
