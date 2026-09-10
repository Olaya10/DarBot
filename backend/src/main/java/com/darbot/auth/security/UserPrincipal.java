package com.darbot.auth.security;

import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.entity.Usuario;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    private Long id;
    private String username;
    private String email;
    private String password;
    private List<String> roles;
    private boolean activo;

    public static UserPrincipal from(Usuario usuario) {
        List<String> roleNames = usuario.getRoles().stream().map(Rol::getNombre).collect(Collectors.toList());
        return UserPrincipal.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .email(usuario.getCorreo())
                .password(usuario.getPassword())
                .roles(roleNames)
                .activo(Boolean.TRUE.equals(usuario.getActivo()))
                .build();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        if (roles == null) return List.of();
        return roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)).collect(Collectors.toList());
    }

    @Override
    public String getPassword() { return password; }

    @Override
    public String getUsername() { return username; }

    @Override
    public boolean isAccountNonExpired() { return activo; }

    @Override
    public boolean isAccountNonLocked() { return activo; }

    @Override
    public boolean isCredentialsNonExpired() { return activo; }

    @Override
    public boolean isEnabled() { return activo; }
}
