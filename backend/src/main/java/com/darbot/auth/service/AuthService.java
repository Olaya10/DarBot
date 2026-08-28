package com.darbot.auth.service;

import com.darbot.auth.dto.LoginRequest;
import com.darbot.auth.dto.RegisterRequest;
import com.darbot.auth.security.JwtTokenProvider;
import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.entity.Usuario;
import com.darbot.usuarios.repository.RolRepository;
import com.darbot.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;



@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public String authenticate(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        return tokenProvider.generateToken(authentication);
    }

    @Transactional
    public Usuario register(RegisterRequest registerRequest) {
        if (usuarioRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("El username ya está en uso");
        }

        if (usuarioRepository.existsByCorreo(registerRequest.getEmail())) {
            throw new RuntimeException("El email ya está registrado");
        }

        Usuario usuario = new Usuario();
        usuario.setUsername(registerRequest.getUsername());
        usuario.setCorreo(registerRequest.getEmail());

        // split nombreCompleto en nombre y apellido
        String nombreCompleto = registerRequest.getNombreCompleto();
        String nombre = nombreCompleto;
        String apellido = "";
        if (nombreCompleto != null && nombreCompleto.contains(" ")) {
            int idx = nombreCompleto.indexOf(' ');
            nombre = nombreCompleto.substring(0, idx);
            apellido = nombreCompleto.substring(idx + 1);
        }

        usuario.setNombre(nombre);
        usuario.setApellido(apellido);
        usuario.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        usuario.setActivo(true);

        // asignar rol
        String nombreRol = registerRequest.getRol() != null ? registerRequest.getRol() : "USER";
        Rol rol = rolRepository.findByNombre(nombreRol)
                .orElseGet(() -> {
                    Rol nuevo = new Rol();
                    nuevo.setNombre(nombreRol);
                    return rolRepository.save(nuevo);
                });

        usuario.getRoles().add(rol);

        return usuarioRepository.save(usuario);
    }

    public Usuario findByUsername(String username) {
        return usuarioRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }
}
