package com.darbot.publico.dto;

import com.darbot.publico.entity.EquipoDirectivo;

public record EquipoDirectivoResponse(
        Long id,
        String nombre,
        String cargo,
        String fotoUrl,
        Integer orden
) {
    public static EquipoDirectivoResponse from(EquipoDirectivo entity) {
        return new EquipoDirectivoResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getCargo(),
                entity.getFotoUrl(),
                entity.getOrden()
        );
    }
}
