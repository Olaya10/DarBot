package com.darbot.institucional.dto;

import com.darbot.institucional.entity.InformacionInstitucional;

public record InformacionInstitucionalResponse(Long id, String nombre, String historia, String mision, String vision,
                                               String valores, String filosofia, String descripcion, String logoUrl,
                                               String nombreInstitucion, String telefonoGeneral, String correoGeneral, String sitioWeb) {
    public static InformacionInstitucionalResponse from(InformacionInstitucional info) {
        return new InformacionInstitucionalResponse(info.getId(), info.getNombre(), info.getHistoria(), info.getMision(), info.getVision(),
                info.getValores(), info.getFilosofia(), info.getDescripcion(), info.getLogoUrl(), info.getNombreInstitucion(),
                info.getTelefonoGeneral(), info.getCorreoGeneral(), info.getSitioWeb());
    }
}
