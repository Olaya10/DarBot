package com.darbot.usuarios.controller;

import com.darbot.usuarios.dto.UsuarioActualizarRequest;
import com.darbot.usuarios.dto.UsuarioRegistroRequest;
import com.darbot.usuarios.dto.UsuarioResponse;
import com.darbot.usuarios.service.UsuarioService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsuarioController {

    private final UsuarioService usuarioService;

    @GetMapping
    public ResponseEntity<List<UsuarioResponse>> listarUsuarios() {
        return ResponseEntity.ok(usuarioService.obtenerTodos().stream()
                .map(UsuarioResponse::from)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioResponse> obtenerUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(UsuarioResponse.from(usuarioService.obtenerPorId(id)));
    }

    @PostMapping("/registrar")
    public ResponseEntity<UsuarioResponse> registrarUsuario(@Valid @RequestBody UsuarioRegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(UsuarioResponse.from(usuarioService.registrarUsuario(request)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsuarioResponse> actualizarUsuario(
            @PathVariable Long id,
            @Valid @RequestBody UsuarioActualizarRequest request) {
        return ResponseEntity.ok(UsuarioResponse.from(usuarioService.actualizarUsuario(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> desactivarUsuario(@PathVariable Long id) {
        usuarioService.desactivarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/activar")
    public ResponseEntity<UsuarioResponse> activarUsuario(@PathVariable Long id) {
        return ResponseEntity.ok(UsuarioResponse.from(usuarioService.activarUsuario(id)));
    }

    @DeleteMapping("/{id}/permanente")
    public ResponseEntity<Void> eliminarUsuarioPermanentemente(@PathVariable Long id) {
        usuarioService.eliminarUsuarioPermanentemente(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/roles")
    public ResponseEntity<UsuarioResponse> asignarRol(
            @PathVariable Long id,
            @RequestParam String rol) {
        return ResponseEntity.ok(UsuarioResponse.from(usuarioService.asignarRol(id, rol)));
    }

    @DeleteMapping("/{id}/roles")
    public ResponseEntity<UsuarioResponse> quitarRol(
            @PathVariable Long id,
            @RequestParam String rol) {
        return ResponseEntity.ok(UsuarioResponse.from(usuarioService.quitarRol(id, rol)));
    }
}