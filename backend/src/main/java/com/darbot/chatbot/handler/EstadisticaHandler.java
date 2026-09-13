package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.publico.entity.Estadistica;
import com.darbot.publico.repository.EstadisticaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class EstadisticaHandler implements IntencionHandler {

    private final EstadisticaRepository estadisticaRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("EstadisticaHandler - procesando consulta");

        List<Estadistica> estadisticas = estadisticaRepository.findByActivoTrueOrderByOrdenAsc();

        if (estadisticas.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_ESTADISTICAS",
                "Actualmente no tengo estadísticas disponibles.");
        }

        String textoLower = texto.toLowerCase();
        List<Estadistica> filtradas = estadisticas;

        // Detectar si pregunta por algo específico
        if (textoLower.contains("estudiante") || textoLower.contains("alumno")) {
            filtradas = estadisticas.stream()
                .filter(e -> e.getLabel() != null && e.getLabel().toLowerCase().contains("estudiante"))
                .toList();
        } else if (textoLower.contains("docente") || textoLower.contains("profesor")) {
            filtradas = estadisticas.stream()
                .filter(e -> e.getLabel() != null && e.getLabel().toLowerCase().contains("docente"))
                .toList();
        } else if (textoLower.contains("egresado")) {
            filtradas = estadisticas.stream()
                .filter(e -> e.getLabel() != null && e.getLabel().toLowerCase().contains("egresado"))
                .toList();
        } else if (textoLower.contains("año") || textoLower.contains("experiencia")) {
            filtradas = estadisticas.stream()
                .filter(e -> e.getLabel() != null && (e.getLabel().toLowerCase().contains("año") || e.getLabel().toLowerCase().contains("experiencia")))
                .toList();
        }

        if (filtradas.isEmpty()) filtradas = estadisticas;

        String mensaje = filtradas.size() == 1
            ? "Aquí está el dato que buscas:"
            : "📊 Estas son nuestras estadísticas institucionales:";

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_ESTADISTICAS", mensaje);

        for (Estadistica e : filtradas) {
            Map<String, Object> item = new HashMap<>();
            item.put("label", e.getLabel());
            item.put("value", e.getValue());
            if (e.getSufijo() != null) item.put("sufijo", e.getSufijo());
            if (e.getIcono() != null) item.put("icono", e.getIcono());
            resultado.getResultados().add(item);
        }

        resultado.setOpciones(Arrays.asList("Ver todas las estadísticas", "Ver noticias", "Conocer la oferta académica"));
        
        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_ESTADISTICAS";
    }
}
