package com.darbot.publico.dto;

import com.darbot.publico.entity.ValorInstitucional;

public record ValorInstitucionalResponse(
        Long id,
        String icono,
        String titulo,
        String descripcion,
        Integer orden
) {
    public static ValorInstitucionalResponse from(ValorInstitucional entity) {
        return new ValorInstitucionalResponse(
                entity.getId(),
                entity.getIcono(),
                entity.getTitulo(),
                entity.getDescripcion(),
                entity.getOrden()
        );
    }
}
