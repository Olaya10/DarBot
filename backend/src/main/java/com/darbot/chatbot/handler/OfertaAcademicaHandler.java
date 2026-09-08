package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.publico.entity.OfertaAcademica;
import com.darbot.publico.repository.OfertaAcademicaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class OfertaAcademicaHandler implements IntencionHandler {

    private final OfertaAcademicaRepository ofertaAcademicaRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        List<OfertaAcademica> ofertas = ofertaAcademicaRepository.findByActivoTrueOrderByOrdenAsc();

        if (ofertas.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_OFERTA_ACADEMICA",
                "No hay oferta académica publicada en este momento.");
        }

        StringBuilder mensaje = new StringBuilder();
        mensaje.append("🎓 Nuestra oferta académica incluye:\n\n");

        for (OfertaAcademica oferta : ofertas) {
            mensaje.append("**").append(oferta.getNombre()).append("**");
            if (oferta.getNivel() != null && !oferta.getNivel().isBlank()) {
                mensaje.append(" (Niveles: ").append(oferta.getNivel()).append(")");
            }
            mensaje.append("\n");
            if (oferta.getDescripcion() != null && !oferta.getDescripcion().isBlank()) {
                mensaje.append("• ").append(oferta.getDescripcion()).append("\n");
            }
            mensaje.append("\n");
        }

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_OFERTA_ACADEMICA", mensaje.toString().trim());
        for (OfertaAcademica oferta : ofertas) {
            Map<String, Object> item = new HashMap<>();
            item.put("nombre", oferta.getNombre());
            item.put("nivel", oferta.getNivel());
            item.put("descripcion", oferta.getDescripcion());
            item.put("slug", oferta.getSlug());
            resultado.getResultados().add(item);
        }
        resultado.setOpciones(Arrays.asList("Ver matrícula","Matrícula","Contacto"));
        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_OFERTA_ACADEMICA";
    }
}
