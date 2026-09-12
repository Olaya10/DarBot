package com.darbot.publico.controller;

import com.darbot.common.service.FileStorageService;
import com.darbot.publico.dto.EquipoDirectivoResponse;
import com.darbot.publico.entity.EquipoDirectivo;
import com.darbot.publico.repository.EquipoDirectivoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/admin/equipo")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminEquipoController {

    private final EquipoDirectivoRepository repository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<EquipoDirectivoResponse>> listar() {
        return ResponseEntity.ok(repository.findAll().stream()
                .map(EquipoDirectivoResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<EquipoDirectivoResponse> obtener(@PathVariable Long id) {
        return repository.findById(id)
                .map(e -> ResponseEntity.ok(EquipoDirectivoResponse.from(e)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<EquipoDirectivoResponse> crear(
            @RequestParam("nombre") String nombre,
            @RequestParam("cargo") String cargo,
            @RequestParam(value = "orden", defaultValue = "0") Integer orden,
            @RequestParam(value = "activo", defaultValue = "true") Boolean activo,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        EquipoDirectivo e = new EquipoDirectivo();
        e.setNombre(nombre);
        e.setCargo(cargo);
        e.setOrden(orden);
        e.setActivo(activo);

        if (file != null && !file.isEmpty()) {
            String ruta = fileStorageService.guardar(file, "equipo");
            e.setFotoUrl(ruta);
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(EquipoDirectivoResponse.from(repository.save(e)));
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<EquipoDirectivoResponse> actualizar(
            @PathVariable Long id,
            @RequestParam("nombre") String nombre,
            @RequestParam("cargo") String cargo,
            @RequestParam(value = "orden", required = false) Integer orden,
            @RequestParam(value = "activo", required = false) Boolean activo,
            @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {

        EquipoDirectivo e = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Miembro no encontrado: " + id));

        e.setNombre(nombre);
        e.setCargo(cargo);
        if (orden != null) e.setOrden(orden);
        if (activo != null) e.setActivo(activo);

        if (file != null && !file.isEmpty()) {
            if (e.getFotoUrl() != null) {
                try { fileStorageService.eliminar(e.getFotoUrl()); } catch (Exception ignored) {}
            }
            String ruta = fileStorageService.guardar(file, "equipo");
            e.setFotoUrl(ruta);
        }

        e.setFechaActualizacion(LocalDateTime.now());
        return ResponseEntity.ok(EquipoDirectivoResponse.from(repository.save(e)));
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
