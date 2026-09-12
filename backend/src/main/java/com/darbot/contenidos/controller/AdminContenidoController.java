package com.darbot.contenidos.controller;

import com.darbot.contenidos.dto.*;
import com.darbot.contenidos.entity.Documento;
import com.darbot.contenidos.service.ContenidoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

import java.util.List;

@RestController
@RequestMapping("/api/admin/contenidos")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminContenidoController {

    private final ContenidoService contenidoService;

    // ==================== NOTICIAS ====================

    @GetMapping("/noticias")
    public ResponseEntity<List<NoticiaResponse>> listarNoticias() {
        return ResponseEntity.ok(contenidoService.obtenerTodasNoticias().stream()
                .map(NoticiaResponse::from)
                .toList());
    }

    @GetMapping("/noticias/{id}")
    public ResponseEntity<NoticiaResponse> obtenerNoticia(@PathVariable Long id) {
        return ResponseEntity.ok(NoticiaResponse.from(contenidoService.obtenerNoticiaPorId(id)));
    }

    @PostMapping("/noticias")
    public ResponseEntity<NoticiaResponse> crearNoticia(@Valid @RequestBody NoticiaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(NoticiaResponse.from(contenidoService.crearNoticia(request)));
    }

    @PutMapping("/noticias/{id}")
    public ResponseEntity<NoticiaResponse> actualizarNoticia(
            @PathVariable Long id,
            @Valid @RequestBody NoticiaRequest request) {
        return ResponseEntity.ok(NoticiaResponse.from(contenidoService.actualizarNoticia(id, request)));
    }

    @DeleteMapping("/noticias/{id}")
    public ResponseEntity<Void> eliminarNoticia(@PathVariable Long id) {
        contenidoService.eliminarNoticia(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== EVENTOS ====================

    @GetMapping("/eventos")
    public ResponseEntity<List<EventoResponse>> listarEventos() {
        return ResponseEntity.ok(contenidoService.obtenerTodosEventos().stream()
                .map(EventoResponse::from)
                .toList());
    }

    @GetMapping("/eventos/{id}")
    public ResponseEntity<EventoResponse> obtenerEvento(@PathVariable Long id) {
        return ResponseEntity.ok(EventoResponse.from(contenidoService.obtenerEventoPorId(id)));
    }

    @PostMapping("/eventos")
    public ResponseEntity<EventoResponse> crearEvento(@Valid @RequestBody EventoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EventoResponse.from(contenidoService.crearEvento(request)));
    }

    @PutMapping("/eventos/{id}")
    public ResponseEntity<EventoResponse> actualizarEvento(
            @PathVariable Long id,
            @Valid @RequestBody EventoRequest request) {
        return ResponseEntity.ok(EventoResponse.from(contenidoService.actualizarEvento(id, request)));
    }

    @DeleteMapping("/eventos/{id}")
    public ResponseEntity<Void> eliminarEvento(@PathVariable Long id) {
        contenidoService.eliminarEvento(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== DOCUMENTOS ====================

    @GetMapping("/documentos")
    public ResponseEntity<List<DocumentoResponse>> listarDocumentos() {
        return ResponseEntity.ok(contenidoService.obtenerTodosDocumentos().stream()
                .map(DocumentoResponse::from)
                .toList());
    }

    @GetMapping("/documentos/{id}")
    public ResponseEntity<DocumentoResponse> obtenerDocumento(@PathVariable Long id) {
        return ResponseEntity.ok(DocumentoResponse.from(contenidoService.obtenerDocumentoPorId(id)));
    }

    @PostMapping("/documentos")
    public ResponseEntity<DocumentoResponse> crearDocumento(@Valid @RequestBody DocumentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(DocumentoResponse.from(contenidoService.crearDocumento(request)));
    }

    @PutMapping("/documentos/{id}")
    public ResponseEntity<DocumentoResponse> actualizarDocumento(
            @PathVariable Long id,
            @Valid @RequestBody DocumentoRequest request) {
        return ResponseEntity.ok(DocumentoResponse.from(contenidoService.actualizarDocumento(id, request)));
    }

    @DeleteMapping("/documentos/{id}")
    public ResponseEntity<Void> eliminarDocumento(@PathVariable Long id) {
        contenidoService.eliminarDocumento(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(value = "/documentos/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<DocumentoResponse> crearDocumentoConArchivo(
            @RequestParam("titulo") String titulo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "tipo", required = false, defaultValue = "General") String tipo,
            @RequestParam("file") MultipartFile file) throws IOException {
        Documento doc = contenidoService.crearDocumentoConArchivo(titulo, descripcion, tipo, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(DocumentoResponse.from(doc));
    }

    @PutMapping(value = "/documentos/{id}/upload", consumes = {"multipart/form-data"})
    public ResponseEntity<DocumentoResponse> actualizarDocumentoConArchivo(
            @PathVariable Long id,
            @RequestParam(value = "titulo", required = false) String titulo,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "tipo", required = false) String tipo,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        Documento doc = contenidoService.actualizarDocumentoConArchivo(id, titulo, descripcion, tipo, file);
        return ResponseEntity.ok(DocumentoResponse.from(doc));
    }

}