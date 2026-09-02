package com.darbot.chatbot.controller;

import com.darbot.chatbot.dto.PreguntaSinRespuestaResponse;
import com.darbot.chatbot.entity.PreguntaSinRespuesta;
import com.darbot.chatbot.repository.PreguntaSinRespuestaRepository;
import com.darbot.chatbot.entity.Faq;
import com.darbot.chatbot.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/admin/chatbot/preguntas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class PreguntasSinRespuestaAdminController {

    private final PreguntaSinRespuestaRepository repository;
    private final FaqRepository faqRepository;

    @GetMapping
    public List<PreguntaSinRespuestaResponse> listar(@RequestParam(required = false) Boolean resuelta) {
        List<PreguntaSinRespuesta> preguntas = resuelta == null
                ? repository.findAll()
                : repository.findByResueltaOrderByFechaDesc(resuelta);
        return preguntas.stream().map(PreguntaSinRespuestaResponse::from).toList();
    }

    @PutMapping("/{id}/resolver")
    public PreguntaSinRespuestaResponse marcarResuelta(@PathVariable Long id) {
        PreguntaSinRespuesta pregunta = repository.findById(id).orElseThrow();
        pregunta.setResuelta(true);
        return PreguntaSinRespuestaResponse.from(repository.save(pregunta));
    }

    @PutMapping("/{id}/reabrir")
    public PreguntaSinRespuestaResponse reabrir(@PathVariable Long id) {
        PreguntaSinRespuesta pregunta = repository.findById(id).orElseThrow();
        pregunta.setResuelta(false);
        return PreguntaSinRespuestaResponse.from(repository.save(pregunta));
    }

    @PostMapping("/{id}/convertir-faq")
    @Transactional
    public PreguntaSinRespuestaResponse convertirEnFaq(@PathVariable Long id, @RequestParam String respuesta) {
        PreguntaSinRespuesta pregunta = repository.findById(id).orElseThrow();
        if (respuesta.isBlank()) throw new IllegalArgumentException("La respuesta es obligatoria");
        Faq faq = new Faq();
        faq.setPregunta(pregunta.getPregunta());
        faq.setRespuesta(respuesta.trim());
        faq.setCategoria("Generada desde preguntas pendientes");
        faq.setActiva(true);
        faqRepository.save(faq);
        pregunta.setResuelta(true);
        return PreguntaSinRespuestaResponse.from(repository.save(pregunta));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}