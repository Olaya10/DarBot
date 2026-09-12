package com.darbot.publico.controller;

import com.darbot.publico.dto.*;
import com.darbot.publico.service.PublicContentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicContentController {

    private final PublicContentService publicContentService;

    @GetMapping("/oferta-academica")
    public ResponseEntity<List<OfertaAcademicaResponse>> obtenerOfertaAcademica() {
        List<OfertaAcademicaResponse> oferta = publicContentService.obtenerOfertaAcademica();
        return ResponseEntity.ok(oferta);
    }

    @GetMapping("/galeria")
    public ResponseEntity<List<GaleriaResponse>> obtenerGaleria(
            @RequestParam(required = false) String categoria) {
        List<GaleriaResponse> galeria = publicContentService.obtenerGaleria(categoria);
        return ResponseEntity.ok(galeria);
    }

    @GetMapping("/matricula")
    public ResponseEntity<List<RequisitoMatriculaResponse>> obtenerRequisitosMatricula() {
        List<RequisitoMatriculaResponse> requisitos = publicContentService.obtenerRequisitosMatricula();
        return ResponseEntity.ok(requisitos);
    }

    @GetMapping("/configuracion")
    public ResponseEntity<Map<String, String>> obtenerConfiguracion() {
        return ResponseEntity.ok(publicContentService.obtenerConfiguracion());
    }

    @GetMapping("/estadisticas")
    public ResponseEntity<List<EstadisticaResponse>> obtenerEstadisticas() {
        return ResponseEntity.ok(publicContentService.obtenerEstadisticas());
    }
    @GetMapping("/faqs")
    public ResponseEntity<List<FaqResponse>> obtenerFaqs() {
        return ResponseEntity.ok(publicContentService.obtenerFaqs());
    }
    @GetMapping("/equipo")
    public ResponseEntity<List<EquipoDirectivoResponse>> obtenerEquipoDirectivo() {
        return ResponseEntity.ok(publicContentService.obtenerEquipoDirectivo());
    }



    @PostMapping("/preinscripciones")
    public ResponseEntity<PreinscripcionResponse> crearPreinscripcion(@Valid @RequestBody PreinscripcionRequest request) {
        return ResponseEntity.ok(publicContentService.crearPreinscripcion(request));
    }


}
