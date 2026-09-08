package com.darbot.chatbot.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
class IntencionServiceChatbotTest {

    @Autowired
    private IntencionService intencionService;

    @Test
    void shouldDetectMatriculaIntentForEnrollmentQuestions() {
        var intencion = intencionService.detectarIntencion("¿Cuáles son los requisitos para matricularme en la institución?");

        assertTrue(intencion.isPresent());
        assertEquals("CONSULTAR_MATRICULA", intencion.get().getNombre());
    }
}
