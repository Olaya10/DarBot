package com.darbot.institucional.dto;

import com.darbot.institucional.entity.Servicio;

public record ServicioResponse(
        Long id,
        String nombre,
        String descripcion,
        String horario,
        String icono,
        Boolean activo
) {
    public static ServicioResponse from(Servicio entity) {
        return new ServicioResponse(
                entity.getId(),
                entity.getNombre(),
                entity.getDescripcion(),
                entity.getHorario(),
                entity.getIcono(),
                entity.getActivo()
        );
    }
}
