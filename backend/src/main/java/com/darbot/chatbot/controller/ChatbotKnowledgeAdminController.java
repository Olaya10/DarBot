package com.darbot.chatbot.controller;

import com.darbot.chatbot.dto.IntencionAdminResponse;
import com.darbot.chatbot.dto.PalabraClaveResponse;
import com.darbot.chatbot.dto.SinonimoAdminResponse;
import com.darbot.chatbot.entity.Intencion;
import com.darbot.chatbot.entity.PalabraClaveIntencion;
import com.darbot.chatbot.entity.Sinonimo;
import com.darbot.chatbot.repository.IntencionRepository;
import com.darbot.chatbot.repository.PalabraClaveIntencionRepository;
import com.darbot.chatbot.repository.SinonimoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/chatbot")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ChatbotKnowledgeAdminController {

    private final IntencionRepository intencionRepository;
    private final PalabraClaveIntencionRepository palabraClaveRepository;
    private final SinonimoRepository sinonimoRepository;

    @GetMapping("/intenciones")
    public List<IntencionAdminResponse> listarIntenciones() {
        return intencionRepository.findAllByOrderByPrioridadDesc().stream().map(IntencionAdminResponse::from).toList();
    }

    @PutMapping("/intenciones/{id}")
    public IntencionAdminResponse actualizarIntencion(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        Intencion intencion = intencionRepository.findById(id).orElseThrow();
        intencion.setNombre((String) datos.get("nombre"));
        intencion.setDescripcion((String) datos.get("descripcion"));
        intencion.setRespuestaPorDefecto((String) datos.get("respuestaPorDefecto"));
        intencion.setActiva(Boolean.TRUE.equals(datos.get("activa")));
        if (datos.get("prioridad") instanceof Number prioridad) intencion.setPrioridad(prioridad.intValue());
        return IntencionAdminResponse.from(intencionRepository.save(intencion));
    }

    @PostMapping("/intenciones/{id}/palabras-clave")
    public ResponseEntity<PalabraClaveResponse> agregarPalabraClave(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        Intencion intencion = intencionRepository.findById(id).orElseThrow();
        PalabraClaveIntencion palabra = new PalabraClaveIntencion();
        palabra.setIntencion(intencion);
        palabra.setPalabra((String) datos.get("palabra"));
        palabra.setEsSinonimo(Boolean.TRUE.equals(datos.get("esSinonimo")));
        if (datos.get("peso") instanceof Number peso) palabra.setPeso(peso.intValue());
        return ResponseEntity.status(HttpStatus.CREATED).body(PalabraClaveResponse.from(palabraClaveRepository.save(palabra)));
    }

    @PutMapping("/palabras-clave/{id}")
    public PalabraClaveResponse actualizarPalabraClave(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        PalabraClaveIntencion palabra = palabraClaveRepository.findById(id).orElseThrow();
        palabra.setPalabra((String) datos.get("palabra"));
        palabra.setEsSinonimo(Boolean.TRUE.equals(datos.get("esSinonimo")));
        if (datos.get("peso") instanceof Number peso) palabra.setPeso(peso.intValue());
        return PalabraClaveResponse.from(palabraClaveRepository.save(palabra));
    }

    @DeleteMapping("/palabras-clave/{id}")
    public ResponseEntity<Void> eliminarPalabraClave(@PathVariable Long id) {
        palabraClaveRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/sinonimos")
    @Transactional(readOnly = true)
    public List<SinonimoAdminResponse> listarSinonimos() {
        return sinonimoRepository.findAll().stream().map(SinonimoAdminResponse::from).toList();
    }

    @PostMapping("/sinonimos")
    public ResponseEntity<SinonimoAdminResponse> crearSinonimo(@RequestBody Map<String, Object> datos) {
        Sinonimo sinonimo = construirSinonimo(datos, new Sinonimo());
        return ResponseEntity.status(HttpStatus.CREATED).body(SinonimoAdminResponse.from(sinonimoRepository.save(sinonimo)));
    }

    @PutMapping("/sinonimos/{id}")
    public SinonimoAdminResponse actualizarSinonimo(@PathVariable Long id, @RequestBody Map<String, Object> datos) {
        Sinonimo sinonimo = sinonimoRepository.findById(id).orElseThrow();
        return SinonimoAdminResponse.from(sinonimoRepository.save(construirSinonimo(datos, sinonimo)));
    }

    @DeleteMapping("/sinonimos/{id}")
    public ResponseEntity<Void> eliminarSinonimo(@PathVariable Long id) {
        sinonimoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Sinonimo construirSinonimo(Map<String, Object> datos, Sinonimo sinonimo) {
        sinonimo.setPalabraBase((String) datos.get("palabraBase"));
        sinonimo.setSinonimo((String) datos.get("sinonimo"));
        sinonimo.setActiva(!Boolean.FALSE.equals(datos.get("activa")));
        if (datos.get("intencionId") instanceof Number intencionId) {
            sinonimo.setIntencion(intencionRepository.findById(intencionId.longValue()).orElseThrow());
        } else {
            sinonimo.setIntencion(null);
        }
        return sinonimo;
    }
}