package com.darbot.institucional.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record InformacionInstitucionalRequest(@NotBlank @Size(max = 200) String nombre, String historia, String mision,
                                              String vision, String valores, String filosofia, String descripcion, @Size(max = 255) String logoUrl,
                                              String nombreInstitucion, String telefonoGeneral, String correoGeneral, String sitioWeb) {}
