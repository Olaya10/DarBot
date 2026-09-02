package com.darbot.chatbot.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FeedbackRequest {
    @NotNull(message = "El sessionId es obligatorio")
    @Size(max = 100, message = "sessionId no puede superar 100 caracteres")
    private String sessionId;

    @NotNull(message = "El mensajeId es obligatorio")
    private Long mensajeId;

    @NotNull(message = "La calificación es obligatoria")
    private Integer calificacion; // 1 = útil, -1 = no útil

    @Size(max = 1000, message = "El comentario no puede superar 1000 caracteres")
    private String comentario;
}
