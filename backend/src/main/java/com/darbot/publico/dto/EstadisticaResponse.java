package com.darbot.publico.dto;

import com.darbot.publico.entity.Estadistica;

public record EstadisticaResponse(
        Long id,
        String label,
        Integer value,
        String sufijo,
        String icono,
        Integer orden
) {
    public static EstadisticaResponse from(Estadistica entity) {
        return new EstadisticaResponse(
                entity.getId(),
                entity.getLabel(),
                entity.getValue(),
                entity.getSufijo(),
                entity.getIcono(),
                entity.getOrden()
        );
    }
}