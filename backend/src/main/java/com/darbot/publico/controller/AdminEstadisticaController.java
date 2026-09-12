package com.darbot.publico.controller;

import com.darbot.publico.dto.EstadisticaRequest;
import com.darbot.publico.dto.EstadisticaResponse;
import com.darbot.publico.entity.Estadistica;
import com.darbot.publico.repository.EstadisticaRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/estadisticas")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEstadisticaController {

    private final EstadisticaRepository repository;

    @GetMapping
    public ResponseEntity<List<EstadisticaResponse>> listar() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(EstadisticaResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EstadisticaResponse> obtener(@PathVariable Long id) {
        return repository.findById(id)
                .map(e -> ResponseEntity.ok(EstadisticaResponse.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EstadisticaResponse> crear(@Valid @RequestBody EstadisticaRequest request) {
        Estadistica e = new Estadistica();
        e.setLabel(request.label());
        e.setValue(request.value());
        e.setSufijo(request.sufijo() != null ? request.sufijo() : "");
        e.setIcono(request.icono());
        e.setOrden(request.orden() != null ? request.orden() : 0);
        e.setActivo(request.activo() != null ? request.activo() : true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EstadisticaResponse.from(repository.save(e)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EstadisticaResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody EstadisticaRequest request) {
        return repository.findById(id)
                .map(e -> {
                    e.setLabel(request.label());
                    e.setValue(request.value());
                    if (request.sufijo() != null) e.setSufijo(request.sufijo());
                    if (request.icono() != null) e.setIcono(request.icono());
                    if (request.orden() != null) e.setOrden(request.orden());
                    if (request.activo() != null) e.setActivo(request.activo());
                    e.setFechaActualizacion(LocalDateTime.now());
                    return ResponseEntity.ok(EstadisticaResponse.from(repository.save(e)));
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
