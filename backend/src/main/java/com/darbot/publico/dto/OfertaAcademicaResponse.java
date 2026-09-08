package com.darbot.publico.dto;

import com.darbot.publico.entity.OfertaAcademica;

public record OfertaAcademicaResponse(
        Long id,
        String nombre,
        String slug,
        String descripcion,
        String nivel,
        String icono,
        Integer orden
) {
    public static OfertaAcademicaResponse from(OfertaAcademica entity) {
        return new OfertaAcademicaResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getSlug(),
                entity.getDescripcion(),
                entity.getNivel(),
                entity.getIcono(),
                entity.getOrden()
        );
    }
}
