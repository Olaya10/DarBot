package com.darbot.chatbot.service;

import com.darbot.common.exception.ResourceNotFoundException;
import com.darbot.chatbot.entity.FraseEspecifica;
import com.darbot.chatbot.entity.Intencion;
import com.darbot.chatbot.entity.PalabraClaveIntencion;
import com.darbot.chatbot.repository.FraseEspecificaRepository;
import com.darbot.chatbot.repository.IntencionRepository;
import com.darbot.chatbot.repository.PalabraClaveIntencionRepository;
import com.darbot.chatbot.util.LenguajeUtil;
import com.darbot.chatbot.util.NormalizadorTexto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class IntencionService {

    private final IntencionRepository intencionRepository;
    private final PalabraClaveIntencionRepository palabraClaveRepository;
    private final FraseEspecificaRepository fraseEspecificaRepository;
    private final NormalizadorTexto normalizador;
    private final LenguajeUtil lenguajeUtil;

    private static final double UMBRAL_COINCIDENCIA = 0.10;

    public List<Intencion> obtenerTodasActivas() {
        return intencionRepository.findByActivaTrueOrderByPrioridadDesc();
    }

    public Optional<Intencion> obtenerPorNombre(String nombre) {
        return intencionRepository.findByNombre(nombre);
    }

    public Map<Intencion, Double> calcularPuntuaciones(String texto) {
        String textoNormalizado = lenguajeUtil.normalizar(texto);
        log.debug("Texto normalizado: '{}' -> '{}'", texto, textoNormalizado);
        
        List<Intencion> intenciones = obtenerTodasActivas();
        
        Map<Intencion, Double> puntuaciones = new HashMap<>();
        
        for (Intencion intencion : intenciones) {
            double puntuacion = calcularPuntuacionParaIntencion(textoNormalizado, intencion);
            if (puntuacion > 0) {
                puntuaciones.put(intencion, puntuacion);
                log.debug("Intención: {}, Puntuación: {}", intencion.getNombre(), puntuacion);
            }
        }
        
        return puntuaciones;
    }

    public Optional<Intencion> detectarIntencion(String texto) {
        String textoNormalizado = lenguajeUtil.normalizar(texto);
        log.info("Texto normalizado: '{}' -> '{}'", texto, textoNormalizado);
        
        Optional<Intencion> intencionPorFrase = verificarFrasesEspecificas(textoNormalizado);
        if (intencionPorFrase.isPresent()) {
            log.info("Intención detectada por frase específica: {}", intencionPorFrase.get().getNombre());
            return intencionPorFrase;
        }
        
        Map<Intencion, Double> puntuaciones = calcularPuntuaciones(textoNormalizado);
        
        if (puntuaciones.isEmpty()) {
            return Optional.empty();
        }

        Optional<Map.Entry<Intencion, Double>> mejor = puntuaciones.entrySet().stream()
            .max(Map.Entry.comparingByValue());
        
        if (mejor.isPresent()) {
            Map.Entry<Intencion, Double> entry = mejor.get();
            log.info("Mejor intención: {} con puntuación: {}", entry.getKey().getNombre(), entry.getValue());
            if (entry.getValue() >= UMBRAL_COINCIDENCIA) {
                return Optional.of(entry.getKey());
            }
        }
        
        return Optional.empty();
    }

    private Optional<Intencion> verificarFrasesEspecificas(String texto) {
        List<FraseEspecifica> frases = fraseEspecificaRepository.findByActivaTrue();
        
        if (frases.isEmpty()) {
            return verificarPalabrasComida(texto);
        }
        
        frases.sort((a, b) -> {
            int pesoCompare = b.getPeso().compareTo(a.getPeso());
            if (pesoCompare != 0) return pesoCompare;
            return Integer.compare(b.getFrase().length(), a.getFrase().length());
        });
        
        for (FraseEspecifica frase : frases) {
            String fraseNormalizada = normalizador.normalizar(frase.getFrase());
            if (texto.contains(fraseNormalizada)) {
                log.info("Frase específica encontrada: '{}' -> Intención: {}", 
                    frase.getFrase(), frase.getIntencion().getNombre());
                return Optional.of(frase.getIntencion());
            }
        }
        
        return verificarPalabrasComida(texto);
    }

    private Optional<Intencion> verificarPalabrasComida(String texto) {
        String[] palabrasComida = {"comer", "comida", "almorzar", "cenar", "desayunar"};
        for (String palabra : palabrasComida) {
            if (texto.contains(palabra)) {
                return intencionRepository.findByNombre("CONSULTAR_SERVICIOS");
            }
        }
        return Optional.empty();
    }

    private double calcularPuntuacionParaIntencion(String texto, Intencion intencion) {
        if (intencion.getPalabrasClave() == null || intencion.getPalabrasClave().isEmpty()) {
            return 0.0;
        }

        double puntuacionTotal = 0.0;
        int totalPeso = 0;
        int coincidenciasExactas = 0;

        Set<String> palabrasBase = lenguajeUtil.getPalabrasBase(texto);
        String textoExpandido = String.join(" ", palabrasBase);

        for (PalabraClaveIntencion pc : intencion.getPalabrasClave()) {
            String palabra = pc.getPalabra().toLowerCase();
            int peso = pc.getPeso() != null ? pc.getPeso() : 1;
            totalPeso += peso;

            if (textoExpandido.contains(palabra) || texto.contains(palabra)) {
                puntuacionTotal += peso * 2.0;
                coincidenciasExactas++;
            }
            
            for (String token : texto.split("\\s+")) {
                if (token.length() > 2 && (token.contains(palabra) || palabra.contains(token))) {
                    puntuacionTotal += peso * 0.5;
                    break;
                }
            }
        }

        if (coincidenciasExactas >= 2) {
            puntuacionTotal += 0.3;
        }

        if (totalPeso == 0) return 0.0;
        
        double resultado = Math.min(puntuacionTotal / totalPeso, 1.0);
        
        for (PalabraClaveIntencion pc : intencion.getPalabrasClave()) {
            int peso = pc.getPeso() != null ? pc.getPeso() : 1;
            if (peso >= 4 && (texto.contains(pc.getPalabra().toLowerCase()) || 
                              textoExpandido.contains(pc.getPalabra().toLowerCase()))) {
                resultado = Math.max(resultado, 0.6);
                break;
            }
        }
        
        return resultado;
    }

    @jakarta.transaction.Transactional
    public Intencion crearIntencion(String nombre, String descripcion, List<String> palabrasClave, Integer prioridad) {
        Intencion intencion = new Intencion();
        intencion.setNombre(nombre);
        intencion.setDescripcion(descripcion);
        intencion.setPrioridad(prioridad != null ? prioridad : 0);
        intencion.setActiva(true);
        
        Intencion saved = intencionRepository.save(intencion);

        if (palabrasClave != null) {
            for (String palabra : palabrasClave) {
                PalabraClaveIntencion pc = new PalabraClaveIntencion();
                pc.setIntencion(saved);
                pc.setPalabra(palabra.trim().toLowerCase());
                pc.setPeso(1);
                pc.setEsSinonimo(false);
                palabraClaveRepository.save(pc);
            }
        }

        return saved;
    }

    @jakarta.transaction.Transactional
    public void agregarFraseEspecifica(String frase, String nombreIntencion, Integer peso) {
        Optional<Intencion> intencionOpt = intencionRepository.findByNombre(nombreIntencion);
        if (intencionOpt.isEmpty()) {
            throw new ResourceNotFoundException("Intención no encontrada: " + nombreIntencion);
        }

        FraseEspecifica fraseEspecifica = new FraseEspecifica();
        fraseEspecifica.setFrase(frase.toLowerCase());
        fraseEspecifica.setIntencion(intencionOpt.get());
        fraseEspecifica.setPeso(peso != null ? peso : 10);
        fraseEspecifica.setActiva(true);
        
        fraseEspecificaRepository.save(fraseEspecifica);
        log.info("Frase específica agregada: '{}' -> {}", frase, nombreIntencion);
    }

    @jakarta.transaction.Transactional
    public void eliminarFraseEspecifica(Long id) {
        fraseEspecificaRepository.deleteById(id);
        log.info("Frase específica eliminada: {}", id);
    }

    public List<FraseEspecifica> obtenerFrasesEspecificas() {
        return fraseEspecificaRepository.findByActivaTrue();
    }
}