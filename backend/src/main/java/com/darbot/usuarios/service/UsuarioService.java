package com.darbot.usuarios.service;

import com.darbot.usuarios.dto.UsuarioRegistroRequest;
import com.darbot.usuarios.dto.UsuarioActualizarRequest;
import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.entity.Usuario;
import com.darbot.usuarios.repository.RolRepository;
import com.darbot.usuarios.repository.UsuarioRepository;
import com.darbot.common.exception.BadRequestException;
import com.darbot.common.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    public Usuario obtenerPorId(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con id: " + id));
    }

    public Usuario obtenerPorUsername(String username) {
        return usuarioRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con username: " + username));
    }

    public Usuario obtenerPorCorreo(String correo) {
        return usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con correo: " + correo));
    }

    @Transactional
    public Usuario registrarUsuario(UsuarioRegistroRequest request) {
        if (usuarioRepository.findByCorreo(request.correo()).isPresent()) {
            throw new BadRequestException("El correo ya está registrado en el sistema");
        }

        if (usuarioRepository.findByUsername(request.username()).isPresent()) {
            throw new BadRequestException("El username ya está registrado en el sistema");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(request.username());
        usuario.setNombre(request.nombre());
        usuario.setApellido(request.apellido());
        usuario.setCorreo(request.correo());
        usuario.setPassword(passwordEncoder.encode(request.password()));
        usuario.setActivo(true);
        usuario.setFechaCreacion(LocalDateTime.now());
        usuario.setFechaActualizacion(LocalDateTime.now());

        String nombreRol = request.rol() != null ? request.rol().toUpperCase() : "USER";
        if (!nombreRol.equals("USER") && !nombreRol.equals("ADMIN")) {
            throw new BadRequestException("El rol debe ser USER o ADMIN");
        }
        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseThrow(() -> new ResourceNotFoundException("Rol no configurado: " + nombreRol));

        usuario.getRoles().add(rol);
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario actualizarUsuario(Long id, UsuarioActualizarRequest request) {
        Usuario usuarioExistente = obtenerPorId(id);

        if (request.getUsername() != null) {
            Optional<Usuario> usuarioConUsername = usuarioRepository.findByUsername(request.getUsername());
            if (usuarioConUsername.isPresent() && !usuarioConUsername.get().getId().equals(id)) {
                throw new BadRequestException("El username ya está registrado por otro usuario");
            }
            usuarioExistente.setUsername(request.getUsername());
        }

        if (request.getNombre() != null) {
            usuarioExistente.setNombre(request.getNombre());
        }
        if (request.getApellido() != null) {
            usuarioExistente.setApellido(request.getApellido());
        }

        if (request.getCorreo() != null) {
            Optional<Usuario> usuarioConCorreo = usuarioRepository.findByCorreo(request.getCorreo());
            if (usuarioConCorreo.isPresent() && !usuarioConCorreo.get().getId().equals(id)) {
                throw new BadRequestException("El correo ya está registrado por otro usuario");
            }
            usuarioExistente.setCorreo(request.getCorreo());
        }

        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            usuarioExistente.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        usuarioExistente.setFechaActualizacion(LocalDateTime.now());
        return usuarioRepository.save(usuarioExistente);
    }

    @Transactional
    public void desactivarUsuario(Long id) {
        Usuario usuario = obtenerPorId(id);
        usuario.setActivo(false);
        usuario.setFechaActualizacion(LocalDateTime.now());
        usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario activarUsuario(Long id) {
        Usuario usuario = obtenerPorId(id);
        usuario.setActivo(true);
        usuario.setFechaActualizacion(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public void eliminarUsuarioPermanentemente(Long id) {
        Usuario usuario = obtenerPorId(id);
        usuarioRepository.delete(usuario);
    }

    @Transactional
    public Usuario asignarRol(Long usuarioId, String nombreRol) {
        Usuario usuario = obtenerPorId(usuarioId);
        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseGet(() -> {
                    Rol nuevoRol = new Rol();
                    nuevoRol.setNombre(nombreRol);
                    return rolRepository.save(nuevoRol);
                });

        usuario.getRoles().add(rol);
        usuario.setFechaActualizacion(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }

    @Transactional
    public Usuario quitarRol(Long usuarioId, String nombreRol) {
        Usuario usuario = obtenerPorId(usuarioId);
        usuario.getRoles().removeIf(r -> r.getNombre().equals(nombreRol));
        usuario.setFechaActualizacion(LocalDateTime.now());
        return usuarioRepository.save(usuario);
    }
}