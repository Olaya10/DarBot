package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.publico.entity.OfertaAcademica;
import com.darbot.publico.entity.RequisitoMatricula;
import com.darbot.publico.entity.RequisitoMatriculaItem;
import com.darbot.publico.repository.OfertaAcademicaRepository;
import com.darbot.publico.repository.RequisitoMatriculaItemRepository;
import com.darbot.publico.repository.RequisitoMatriculaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatriculaHandler implements IntencionHandler {

    private final RequisitoMatriculaRepository requisitoMatriculaRepository;
    private final RequisitoMatriculaItemRepository requisitoMatriculaItemRepository;
    private final OfertaAcademicaRepository ofertaAcademicaRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        String consulta = texto == null ? "" : texto.toLowerCase(Locale.ROOT);

        List<RequisitoMatricula> requisitos = requisitoMatriculaRepository.findByActivoTrueOrderByOrdenAsc();
        List<OfertaAcademica> ofertaAcademica = ofertaAcademicaRepository.findByActivoTrueOrderByOrdenAsc();

        if (requisitos.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_MATRICULA",
                "La matrícula aún no tiene requisitos publicados en el sistema. Puedes comunicarte con la institución para mayor información.");
        }

        StringBuilder mensaje = new StringBuilder();
        mensaje.append("📘 Proceso de matrícula en la I.E. Darío Torregroza Pérez\n\n");

        for (RequisitoMatricula requisito : requisitos) {
            mensaje.append("**").append(requisito.getTitulo()).append("**\n");
            List<RequisitoMatriculaItem> items = requisitoMatriculaItemRepository
                .findByRequisitoMatricula_IdAndActivoTrueOrderByOrdenAsc(requisito.getId());

            for (RequisitoMatriculaItem item : items) {
                mensaje.append("• ").append(item.getTexto()).append("\n");
            }
            mensaje.append("\n");
        }

        if (consulta.contains("oferta") || consulta.contains("programa") || consulta.contains("niveles") || consulta.contains("preescolar") || consulta.contains("primaria") || consulta.contains("secundaria")) {
            mensaje.append("🎓 Oferta académica disponible:\n");
            for (OfertaAcademica oferta : ofertaAcademica) {
                mensaje.append("• ").append(oferta.getNivel()).append(" - ").append(oferta.getNombre()).append("\n");
            }
        }

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_MATRICULA", mensaje.toString().trim());

        for (RequisitoMatricula requisito : requisitos) {
            Map<String, Object> item = new HashMap<>();
            item.put("titulo", requisito.getTitulo());
            item.put("nivel", requisito.getNivel());
            item.put("descripcion", requisito.getDescripcion());
            item.put("items", requisitoMatriculaItemRepository
                .findByRequisitoMatricula_IdAndActivoTrueOrderByOrdenAsc(requisito.getId())
                .stream()
                .map(itemEntity -> itemEntity.getTexto())
                .toList());
            resultado.getResultados().add(item);
        }

        resultado.setOpciones(Arrays.asList(
            "Ver requisitos de matrícula",
            "Preinscripción",
            "Oferta académica",
            "Contactar a la institución"
        ));

        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_MATRICULA";
    }
}
