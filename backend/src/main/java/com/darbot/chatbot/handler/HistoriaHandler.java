package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.institucional.entity.InformacionInstitucional;
import com.darbot.institucional.repository.InformacionInstitucionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class HistoriaHandler implements IntencionHandler {

    private final InformacionInstitucionalRepository infoRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("HistoriaHandler - procesando consulta");

        Optional<InformacionInstitucional> infoOpt = infoRepository.findAll().stream().findFirst();

        if (infoOpt.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_HISTORIA",
                "Actualmente no tengo información sobre la historia de la institución.");
        }

        InformacionInstitucional info = infoOpt.get();
        String historia = info.getHistoria();

        if (historia == null || historia.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_HISTORIA",
                "Aún no tengo registrada la historia de la institución.");
        }

        // Si la pregunta pide específicamente misión, visión o filosofía
        String textoLower = texto.toLowerCase();
        String mensaje;
        String tipo = "HISTORIA";
        
        if (textoLower.contains("mision") || textoLower.contains("misión")) {
            mensaje = "🎯 Nuestra misión:\n\n" + info.getMision();
            tipo = "MISION";
        } else if (textoLower.contains("vision") || textoLower.contains("visión")) {
            mensaje = "🔭 Nuestra visión:\n\n" + info.getVision();
            tipo = "VISION";
        } else if (textoLower.contains("filosofia") || textoLower.contains("filosofía")) {
            mensaje = "💭 Nuestra filosofía:\n\n" + info.getFilosofia();
            tipo = "FILOSOFIA";
        } else if (textoLower.contains("quienes somos") || textoLower.contains("quiénes somos")) {
            mensaje = "🏫 Sobre la " + (info.getNombreInstitucion() != null ? info.getNombreInstitucion() : "institución") + ":\n\n" + 
                (info.getDescripcion() != null ? info.getDescripcion() : historia);
            tipo = "INSTITUCION";
        } else {
            mensaje = "📖 Historia de la " + (info.getNombreInstitucion() != null ? info.getNombreInstitucion() : "institución") + ":\n\n" + historia;
        }

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_HISTORIA", mensaje);
        resultado.setOpciones(Arrays.asList("Ver misión", "Ver visión", "Ver valores", "Ver equipo"));
        
        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_HISTORIA";
    }
}
