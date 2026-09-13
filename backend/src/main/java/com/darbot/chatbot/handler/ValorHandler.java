package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.publico.entity.ValorInstitucional;
import com.darbot.publico.repository.ValorInstitucionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ValorHandler implements IntencionHandler {

    private final ValorInstitucionalRepository valorRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("ValorHandler - procesando consulta");

        List<ValorInstitucional> valores = valorRepository.findByActivoTrueOrderByOrdenAsc();

        if (valores.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_VALORES",
                "Actualmente no tengo información sobre los valores institucionales.");
        }

        String textoLower = texto.toLowerCase();
        List<ValorInstitucional> filtrados = valores;

        // Filtrar por valor específico
        for (ValorInstitucional v : valores) {
            String titulo = v.getTitulo() != null ? v.getTitulo().toLowerCase() : "";
            if (textoLower.contains(titulo) && !titulo.isEmpty()) {
                filtrados = List.of(v);
                break;
            }
        }

        String mensaje = filtrados.size() == 1
            ? "Aquí está el valor que buscas:"
            : "💛 Nuestros valores institucionales son:";

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_VALORES", mensaje);

        for (ValorInstitucional v : filtrados) {
            Map<String, Object> item = new HashMap<>();
            item.put("titulo", v.getTitulo());
            item.put("descripcion", v.getDescripcion());
            if (v.getIcono() != null) item.put("icono", v.getIcono());
            resultado.getResultados().add(item);
        }

        resultado.setOpciones(Arrays.asList("Ver misión y visión", "Conocer al equipo", "Ver servicios"));
        
        return resultado;
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_VALORES";
    }
}
