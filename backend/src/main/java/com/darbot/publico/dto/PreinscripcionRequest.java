package com.darbot.publico.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PreinscripcionRequest(
        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 150, message = "Los nombres no pueden exceder 150 caracteres")
        String nombres,

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 150, message = "Los apellidos no pueden exceder 150 caracteres")
        String apellidos,

        @NotBlank(message = "El tipo de documento es obligatorio")
        String tipoDocumento,

        @NotBlank(message = "El número de documento es obligatorio")
        @Size(max = 50, message = "El número de documento no puede exceder 50 caracteres")
        String numeroDocumento,

        LocalDate fechaNacimiento,

        @Email(message = "El correo electrónico no es válido")
        @Size(max = 150, message = "El correo no puede exceder 150 caracteres")
        String email,

        @Size(max = 50, message = "El teléfono no puede exceder 50 caracteres")
        String telefono,

        @NotBlank(message = "El nivel de interés es obligatorio")
        String nivelInteres,

        @Size(max = 80, message = "La sede no puede exceder 80 caracteres")
        String sede,

        String observaciones,

        @NotNull(message = "El estado es obligatorio")
        String estado
) {}
