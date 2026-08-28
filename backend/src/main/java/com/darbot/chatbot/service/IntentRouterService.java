package com.darbot.chatbot.service;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.chatbot.handler.IntencionHandler;
import com.darbot.chatbot.util.ExtractorDatos;
import com.darbot.chatbot.util.LenguajeUtil;
import com.darbot.chatbot.entity.Conversacion;
import com.darbot.chatbot.entity.Faq;
import com.darbot.chatbot.entity.Intencion;
import com.darbot.chatbot.entity.PreguntaSinRespuesta;
import com.darbot.chatbot.repository.PreguntaSinRespuestaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntentRouterService {

    private final IntencionService intencionService;
    private final PuntuacionService puntuacionService;
    private final LenguajeUtil lenguajeUtil;
    private final ExtractorDatos extractorDatos;
    private final ContextoService contextoService;
    private final PreguntaSinRespuestaRepository preguntaRepository;
    
    private final List<IntencionHandler> handlers;

    public ResultadoChatbot procesar(String texto, Conversacion conversacion) {
        String textoNormalizado = lenguajeUtil.normalizar(texto);
        
        // Verificar negación
        boolean tieneNegacion = lenguajeUtil.contieneNegacion(textoNormalizado);
        String elementoNegado = tieneNegacion ? lenguajeUtil.extraerElementoNegado(textoNormalizado) : null;
        String textoSinNegacion = tieneNegacion ? lenguajeUtil.eliminarNegaciones(textoNormalizado) : textoNormalizado;
        
        if (tieneNegacion && elementoNegado != null && !elementoNegado.isEmpty()) {
            log.info("Negación detectada: elemento='{}'", elementoNegado);
        }

        // Verificar contexto
        boolean esContexto = contextoService.esPreguntaDeContexto(textoNormalizado);
        if (esContexto) {
            var contextoOpt = contextoService.obtenerContexto(conversacion);
            if (contextoOpt.isPresent() && contextoOpt.get().getUltimaIntencion() != null) {
                Optional<Intencion> intencionOpt = intencionService.obtenerPorNombre(
                    contextoOpt.get().getUltimaIntencion()
                );
                if (intencionOpt.isPresent()) {
                    Map<String, Object> entidades = extractorDatos.extraerEntidades(textoNormalizado);
                    return procesarHandler(intencionOpt.get().getNombre(), textoNormalizado, entidades, elementoNegado);
                }
            }
        }

        // Verificar intención
        Optional<Intencion> intencionOpt = intencionService.detectarIntencion(
            tieneNegacion ? textoSinNegacion : textoNormalizado
        );
        
        if (intencionOpt.isPresent()) {
            Map<String, Object> entidades = extractorDatos.extraerEntidades(textoNormalizado);
            return procesarHandler(intencionOpt.get().getNombre(), textoNormalizado, entidades, elementoNegado);
        }

        // Buscar FAQ
        Optional<Faq> faqOpt = puntuacionService.obtenerMejorFaq(textoNormalizado);
        if (faqOpt.isPresent()) {
            return new ResultadoChatbot("CONSULTAR_FAQ", faqOpt.get().getRespuesta());
        }

        // Sin resultado
        guardarPreguntaSinRespuesta(texto, null);
        return new ResultadoChatbot("DESCONOCIDA", 
            "🔍 No encontré información sobre tu consulta. La he registrado para que los administradores puedan mejorar mi base de conocimiento.");
    }

    private ResultadoChatbot procesarHandler(String intencion, String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("Buscando handler para intención: '{}'", intencion);
        log.info("Handlers disponibles: {}", handlers.stream().map(IntencionHandler::getIntencion).toList());
        
        for (IntencionHandler handler : handlers) {
            if (handler.getIntencion().equals(intencion)) {
                log.info("Handler encontrado: {}", handler.getClass().getSimpleName());
                return handler.procesar(texto, entidades, elementoNegado);
            }
        }
        log.warn("No se encontró handler para la intención: '{}'", intencion);
        return new ResultadoChatbot(intencion, "No pude procesar tu solicitud.");
    }

    public ResultadoChatbot procesarPreguntaCompuesta(String texto) {
        List<String> partes = lenguajeUtil.dividirPreguntaCompuesta(texto);
        StringBuilder mensaje = new StringBuilder("📌 **Respuesta a tu consulta:**\n\n");
        
        for (String parte : partes) {
            String parteNormalizada = lenguajeUtil.normalizar(parte);
            Optional<Intencion> intencionOpt = intencionService.detectarIntencion(parteNormalizada);
            if (intencionOpt.isPresent()) {
                Map<String, Object> entidades = extractorDatos.extraerEntidades(parteNormalizada);
                ResultadoChatbot resultado = procesarHandler(intencionOpt.get().getNombre(), parteNormalizada, entidades, null);
                mensaje.append("• ").append(resultado.getMensaje()).append("\n\n");
            } else {
                guardarPreguntaSinRespuesta(parte, null);
                mensaje.append("• ❌ No pude entender: \"").append(parte).append("\"\n\n");
            }
        }
        
        return new ResultadoChatbot("COMPUESTA", mensaje.toString());
    }

    private void guardarPreguntaSinRespuesta(String pregunta, String intentoIntencion) {
        PreguntaSinRespuesta registro = new PreguntaSinRespuesta();
        registro.setPregunta(pregunta);
        registro.setIntentoIntencion(intentoIntencion);
        registro.setResuelta(false);
        preguntaRepository.save(registro);
    }
}
