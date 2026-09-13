package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.publico.entity.EquipoDirectivo;
import com.darbot.publico.repository.EquipoDirectivoRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class EquipoHandler implements IntencionHandler {

    private final EquipoDirectivoRepository equipoRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("EquipoHandler - procesando consulta");

        List<EquipoDirectivo> equipo = equipoRepository.findByActivoTrueOrderByOrdenAsc();

        if (equipo.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_EQUIPO",
                "Actualmente no tengo información sobre el equipo directivo.");
        }

        // Filtrar si hay un cargo específico en la pregunta
        String textoLower = texto.toLowerCase();
        List<EquipoDirectivo> filtrados = equipo;
        
        for (EquipoDirectivo miembro : equipo) {
            String cargo = miembro.getCargo() != null ? miembro.getCargo().toLowerCase() : "";
            String nombre = miembro.getNombre() != null ? miembro.getNombre().toLowerCase() : "";
            
            // Si la pregunta menciona el cargo o el nombre, priorizar
            if (textoLower.contains("rector") && cargo.contains("rector")) {
                filtrados = List.of(miembro);
                break;
            }
            if (textoLower.contains("coordinador") && cargo.contains("coordinador")) {
                // Devolver todos los coordinadores
                filtrados = equipo.stream()
                    .filter(e -> e.getCargo() != null && e.getCargo().toLowerCase().contains("coordinador"))
                    .toList();
                break;
            }
        }

        String mensaje = filtrados.size() == 1
            ? "Aquí está la información:"
            : "El equipo directivo de la institución está conformado por:";

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_EQUIPO", mensaje);

        for (EquipoDirectivo m : filtrados) {
            Map<String, Object> item = new HashMap<>();
            item.put("nombre", m.getNombre());
            item.put("cargo", m.getCargo());
            if (m.getFotoUrl() != null) item.put("fotoUrl", m.getFotoUrl());
            resultado.getResultados().add(item);
        }

        resultado.setOpciones(Arrays.asList("Ver todos los directivos", "Contactar con rectoría"));
        
        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_EQUIPO";
    }
}
