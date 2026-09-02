package com.darbot.chatbot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatbotPreguntaRequest(
        @NotBlank(message = "sessionId es obligatorio")
        @Size(max = 100, message = "sessionId no puede superar 100 caracteres")
        String sessionId,
        @NotBlank(message = "mensaje es obligatorio")
        @Size(max = 2000, message = "El mensaje no puede superar 2000 caracteres")
        String mensaje
) {
}
