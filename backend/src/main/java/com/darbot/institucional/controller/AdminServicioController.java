package com.darbot.institucional.controller;

import com.darbot.institucional.dto.ServicioRequest;
import com.darbot.institucional.dto.ServicioResponse;
import com.darbot.institucional.entity.Servicio;
import com.darbot.institucional.repository.ServicioRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/servicios")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminServicioController {

    private final ServicioRepository repository;

    @GetMapping
    public ResponseEntity<List<ServicioResponse>> listar() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(ServicioResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ServicioResponse> obtener(@PathVariable Long id) {
        return repository.findById(id)
                .map(s -> ResponseEntity.ok(ServicioResponse.from(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ServicioResponse> crear(@Valid @RequestBody ServicioRequest request) {
        Servicio s = new Servicio();
        s.setNombre(request.nombre());
        s.setDescripcion(request.descripcion());
        s.setHorario(request.horario());
        s.setIcono(request.icono());
        s.setOrden(request.orden() != null ? request.orden() : 0);
        s.setActivo(request.activo() != null ? request.activo() : true);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ServicioResponse.from(repository.save(s)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ServicioResponse> actualizar(
            @PathVariable Long id,
            @Valid @RequestBody ServicioRequest request) {
        return repository.findById(id)
                .map(s -> {
                    s.setNombre(request.nombre());
                    s.setDescripcion(request.descripcion());
                    s.setHorario(request.horario());
                    s.setIcono(request.icono());
                    if (request.orden() != null) s.setOrden(request.orden());
                    if (request.activo() != null) s.setActivo(request.activo());
                    s.setFechaActualizacion(LocalDateTime.now());
                    return ResponseEntity.ok(ServicioResponse.from(repository.save(s)));
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
