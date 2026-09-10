package com.darbot.auth.service;

import com.darbot.auth.dto.LoginRequest;
import com.darbot.auth.dto.RegisterRequest;
import com.darbot.auth.security.JwtTokenProvider;
import com.darbot.common.exception.BadRequestException;
import com.darbot.common.exception.ResourceNotFoundException;
import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.entity.Usuario;
import com.darbot.usuarios.repository.RolRepository;
import com.darbot.usuarios.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private RolRepository rolRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private Rol rolUser;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setNombreCompleto("Juan Perez");

        rolUser = new Rol();
        rolUser.setId(1L);
        rolUser.setNombre("USER");
    }

    @Test
    void register_Exitoso() {
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(false);
        when(usuarioRepository.existsByCorreo("test@example.com")).thenReturn(false);
        when(rolRepository.findByNombre("USER")).thenReturn(Optional.of(rolUser));
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");
        when(usuarioRepository.save(any(Usuario.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Usuario usuarioGuardado = authService.register(registerRequest);

        assertNotNull(usuarioGuardado);
        assertEquals("testuser", usuarioGuardado.getUsername());
        assertEquals("test@example.com", usuarioGuardado.getCorreo());
        assertEquals("Juan", usuarioGuardado.getNombre());
        assertEquals("Perez", usuarioGuardado.getApellido());
        assertEquals("encodedPassword", usuarioGuardado.getPassword());
        assertTrue(usuarioGuardado.getRoles().contains(rolUser));
        verify(usuarioRepository).save(any(Usuario.class));
    }

    @Test
    void register_UsernameDuplicado_LanzaBadRequestException() {
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(registerRequest));
        assertEquals("El username ya está en uso", ex.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void register_EmailDuplicado_LanzaBadRequestException() {
        when(usuarioRepository.existsByUsername("testuser")).thenReturn(false);
        when(usuarioRepository.existsByCorreo("test@example.com")).thenReturn(true);

        BadRequestException ex = assertThrows(BadRequestException.class, () -> authService.register(registerRequest));
        assertEquals("El email ya está registrado", ex.getMessage());
        verify(usuarioRepository, never()).save(any());
    }

    @Test
    void findByUsername_Exitoso() {
        Usuario usuario = new Usuario();
        usuario.setUsername("testuser");
        when(usuarioRepository.findByUsernameIgnoreCase("testuser")).thenReturn(Optional.of(usuario));

        Usuario resultado = authService.findByUsername("testuser");

        assertNotNull(resultado);
        assertEquals("testuser", resultado.getUsername());
    }

    @Test
    void findByUsername_NoEncontrado_LanzaResourceNotFoundException() {
        when(usuarioRepository.findByUsernameIgnoreCase("desconocido")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> authService.findByUsername("desconocido"));
    }

    @Test
    void authenticate_Exitoso() {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername("testuser");
        loginRequest.setPassword("password123");

        Authentication authentication = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(tokenProvider.generateToken(authentication)).thenReturn("jwt.token.valido");

        String token = authService.authenticate(loginRequest);

        assertEquals("jwt.token.valido", token);
    }
}
