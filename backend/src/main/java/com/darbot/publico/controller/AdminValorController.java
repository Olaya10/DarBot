package com.darbot.publico.controller;

import com.darbot.publico.dto.ValorInstitucionalRequest;
import com.darbot.publico.dto.ValorInstitucionalResponse;
import com.darbot.publico.entity.ValorInstitucional;
import com.darbot.publico.repository.ValorInstitucionalRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/valores")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminValorController {

    private final ValorInstitucionalRepository repository;

    @GetMapping
    public ResponseEntity<List<ValorInstitucionalResponse>> listar() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(ValorInstitucionalResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ValorInstitucionalResponse> obtener(@PathVariable Long id) {
        return repository.findById(id)
                .map(v -> ResponseEntity.ok(ValorInstitucionalResponse.from(v)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ValorInstitucionalResponse> crear(@Valid @RequestBody ValorInstitucionalRequest request) {
        ValorInstitucional v = new ValorInstitucional();
        v.setIcono(request.icono());
        v.setTitulo(request.titulo());
        v.setDescripcion(request.descripcion());
        v.setOrden(request.orden() != null ? request.orden() : 0);
        v.setActivo(request.activo() != null ? request.activo() : true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ValorInstitucionalResponse.from(repository.save(v)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ValorInstitucionalResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ValorInstitucionalRequest request) {
        return repository.findById(id)
                .map(v -> {
                    v.setIcono(request.icono());
                    v.setTitulo(request.titulo());
                    v.setDescripcion(request.descripcion());
                    if (request.orden() != null) v.setOrden(request.orden());
                    if (request.activo() != null) v.setActivo(request.activo());
                    v.setFechaActualizacion(LocalDateTime.now());
                    return ResponseEntity.ok(ValorInstitucionalResponse.from(repository.save(v)));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        if (!repository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
