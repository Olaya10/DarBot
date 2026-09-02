package com.darbot.chatbot.dto;

import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
public class ChatbotRespuesta {
    private String respuesta;
    private String intencion;
    private Map<String, Object> entidades;
    private List<Map<String, Object>> resultados;
    private List<String> opciones;
    private Long mensajeId; // ID del mensaje BOT para feedback
}