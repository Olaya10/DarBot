package com.darbot.publico.dto;

public record EquipoDirectivoRequest(
        String nombre,
        String cargo,
        Integer orden,
        Boolean activo
) {}
