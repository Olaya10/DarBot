package com.darbot.config;

import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.entity.Usuario;
import com.darbot.usuarios.repository.RolRepository;
import com.darbot.usuarios.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminUserInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Crear rol ADMIN si no existe
        Rol rolAdmin = rolRepository.findByNombre("ADMIN").orElseGet(() -> {
            Rol r = new Rol();
            r.setNombre("ADMIN");
            return rolRepository.save(r);
        });

        // Crear usuario admin para pruebas si no existe
        String adminUsername = "admin";
        if (usuarioRepository.findByUsernameIgnoreCase(adminUsername).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setUsername(adminUsername);
            admin.setNombre("Admin");
            admin.setApellido("User");
            admin.setCorreo("admin@example.com");
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setActivo(true);
            admin.getRoles().add(rolAdmin);
            usuarioRepository.save(admin);
        }
    }
}
