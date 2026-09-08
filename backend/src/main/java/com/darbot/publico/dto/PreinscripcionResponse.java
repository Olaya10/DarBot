package com.darbot.publico.dto;

import com.darbot.publico.entity.Preinscripcion;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record PreinscripcionResponse(
        Long id,
        String nombres,
        String apellidos,
        String tipoDocumento,
        String numeroDocumento,
        LocalDate fechaNacimiento,
        String email,
        String telefono,
        String nivelInteres,
        String sede,
        String observaciones,
        String estado,
        LocalDateTime fechaCreacion
) {
    public static PreinscripcionResponse from(Preinscripcion entity) {
        return new PreinscripcionResponse(
                entity.getId(),
                entity.getNombres(),
                entity.getApellidos(),
                entity.getTipoDocumento(),
                entity.getNumeroDocumento(),
                entity.getFechaNacimiento(),
                entity.getEmail(),
                entity.getTelefono(),
                entity.getNivelInteres(),
                entity.getSede(),
                entity.getObservaciones(),
                entity.getEstado(),
                entity.getFechaCreacion()
        );
    }
}
