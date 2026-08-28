package com.darbot.chatbot.dto;

import com.darbot.chatbot.entity.PalabraClaveIntencion;

public record PalabraClaveResponse(Long id, String palabra, Boolean esSinonimo, Integer peso) {
    public static PalabraClaveResponse from(PalabraClaveIntencion palabra) {
        return new PalabraClaveResponse(palabra.getId(), palabra.getPalabra(), palabra.getEsSinonimo(), palabra.getPeso());
    }
}