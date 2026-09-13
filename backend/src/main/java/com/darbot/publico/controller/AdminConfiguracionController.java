package com.darbot.publico.controller;

import com.darbot.publico.entity.ConfiguracionSitio;
import com.darbot.publico.repository.ConfiguracionSitioRepository;
import com.darbot.common.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.HashMap;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/configuracion")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminConfiguracionController {

    private final ConfiguracionSitioRepository repository;
    private final FileStorageService fileStorageService;

    @GetMapping
    public ResponseEntity<List<ConfiguracionSitio>> listar() {
        return ResponseEntity.ok(repository.findAll());
    }

    /**
     * Guarda o actualiza múltiples claves de configuración de una vez.
     * Body: { "hero_titulo": "...", "hero_frase": "...", "telefono": "..." }
     */
    @PutMapping
    public ResponseEntity<List<ConfiguracionSitio>> guardar(@RequestBody Map<String, String> valores) {
        for (Map.Entry<String, String> entry : valores.entrySet()) {
            String clave = entry.getKey();
            String valor = entry.getValue() != null ? entry.getValue() : "";

            ConfiguracionSitio config = repository.findByClaveAndActivoTrue(clave)
                    .orElseGet(() -> {
                        ConfiguracionSitio nueva = new ConfiguracionSitio();
                        nueva.setClave(clave);
                        nueva.setTipo("string");
                        nueva.setActivo(true);
                        nueva.setFechaCreacion(LocalDateTime.now());
                        return nueva;
                    });

            config.setValor(valor);
            config.setFechaActualizacion(LocalDateTime.now());
            repository.save(config);
        }
        return ResponseEntity.ok(repository.findAll());
    }

    /**
     * Sube una nueva imagen de logo y actualiza configuracion_sitio.logo_url
     */
    @PostMapping(value = "/upload-logo", consumes = {"multipart/form-data"})
    public ResponseEntity<Map<String, String>> uploadLogo(@RequestParam("file") MultipartFile file) throws IOException {
        // Guardar el archivo en uploads/logo/
        String ruta = fileStorageService.guardar(file, "logo");

        // Actualizar la clave logo_url en configuracion_sitio
        ConfiguracionSitio config = repository.findByClaveAndActivoTrue("logo_url")
                .orElseGet(() -> {
                    ConfiguracionSitio nueva = new ConfiguracionSitio();
                    nueva.setClave("logo_url");
                    nueva.setTipo("string");
                    nueva.setActivo(true);
                    nueva.setFechaCreacion(LocalDateTime.now());
                    return nueva;
                });

        config.setValor(ruta);
        config.setFechaActualizacion(LocalDateTime.now());
        repository.save(config);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("logo_url", ruta);
        respuesta.put("mensaje", "Logo actualizado correctamente");
        return ResponseEntity.ok(respuesta);
    }

    /**
     * Restaura el logo original
     */
    @PostMapping("/restore-logo")
    public ResponseEntity<Map<String, String>> restoreLogo() {
        String logoOriginal = "imagenes/Logo IEDTP.jpeg";

        ConfiguracionSitio config = repository.findByClaveAndActivoTrue("logo_url")
                .orElseGet(() -> {
                    ConfiguracionSitio nueva = new ConfiguracionSitio();
                    nueva.setClave("logo_url");
                    nueva.setTipo("string");
                    nueva.setActivo(true);
                    nueva.setFechaCreacion(LocalDateTime.now());
                    return nueva;
                });

        config.setValor(logoOriginal);
        config.setFechaActualizacion(LocalDateTime.now());
        repository.save(config);

        Map<String, String> respuesta = new HashMap<>();
        respuesta.put("logo_url", logoOriginal);
        respuesta.put("mensaje", "Logo restaurado al original");
        return ResponseEntity.ok(respuesta);
    }

}
