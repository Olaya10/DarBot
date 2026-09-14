package com.darbot.usuarios.controller;

import com.darbot.common.service.FileStorageService;
import com.darbot.usuarios.entity.Usuario;
import com.darbot.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/perfil")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminPerfilController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> obtenerPerfil(Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", usuario.getId());
        response.put("username", usuario.getUsername());
        response.put("nombre", usuario.getNombre());
        response.put("apellido", usuario.getApellido());
        response.put("correo", usuario.getCorreo());
        response.put("fotoPerfil", usuario.getFotoPerfil());
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Map<String, Object>> actualizarPerfil(
            Authentication auth,
            @RequestBody Map<String, String> datos) {
        
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (datos.get("nombre") != null) usuario.setNombre(datos.get("nombre").trim());
        if (datos.get("apellido") != null) usuario.setApellido(datos.get("apellido").trim());
        if (datos.get("correo") != null) usuario.setCorreo(datos.get("correo").trim());
        
        Usuario actualizado = usuarioRepository.save(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", actualizado.getId());
        response.put("username", actualizado.getUsername());
        response.put("nombre", actualizado.getNombre());
        response.put("apellido", actualizado.getApellido());
        response.put("correo", actualizado.getCorreo());
        response.put("fotoPerfil", actualizado.getFotoPerfil());
        response.put("mensaje", "Perfil actualizado correctamente");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cambiar-password")
    public ResponseEntity<Map<String, String>> cambiarPassword(
            Authentication auth,
            @RequestBody Map<String, String> datos) {
        
        String passwordActual = datos.get("passwordActual");
        String passwordNueva = datos.get("passwordNueva");
        
        if (passwordActual == null || passwordNueva == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debes enviar ambas contraseñas"));
        }
        
        if (passwordNueva.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "La nueva contraseña debe tener al menos 6 caracteres"));
        }
        
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (!passwordEncoder.matches(passwordActual, usuario.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("error", "La contraseña actual es incorrecta"));
        }
        
        usuario.setPassword(passwordEncoder.encode(passwordNueva));
        usuarioRepository.save(usuario);
        
        return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente"));
    }

    @PostMapping(value = "/foto", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, Object>> subirFoto(
            Authentication auth,
            @RequestParam("file") MultipartFile file) throws IOException {
        
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Debes seleccionar una imagen"));
        }
        
        // Validar tipo de archivo
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo debe ser una imagen"));
        }
        
        // Validar tamaño (2MB)
        if (file.getSize() > 2 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "La imagen no debe superar 2MB"));
        }
        
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        // Eliminar foto anterior si existe
        if (usuario.getFotoPerfil() != null) {
            try { fileStorageService.eliminar(usuario.getFotoPerfil()); } catch (Exception ignored) {}
        }
        
        // Guardar nueva foto
        String ruta = fileStorageService.guardar(file, "perfiles");
        usuario.setFotoPerfil(ruta);
        usuarioRepository.save(usuario);
        
        Map<String, Object> response = new HashMap<>();
        response.put("fotoPerfil", ruta);
        response.put("mensaje", "Foto de perfil actualizada");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/foto")
    public ResponseEntity<Map<String, String>> eliminarFoto(Authentication auth) {
        Usuario usuario = usuarioRepository.findByUsername(auth.getName())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        
        if (usuario.getFotoPerfil() != null) {
            try { fileStorageService.eliminar(usuario.getFotoPerfil()); } catch (Exception ignored) {}
            usuario.setFotoPerfil(null);
            usuarioRepository.save(usuario);
        }
        
        return ResponseEntity.ok(Map.of("mensaje", "Foto eliminada"));
    }
}
