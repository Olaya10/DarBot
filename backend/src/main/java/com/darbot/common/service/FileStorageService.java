package com.darbot.common.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    /**
     * Guarda un archivo en {uploadDir}/{subcarpeta}/
     * Devuelve una URL unificada servida por el backend: /api/archivos/{subcarpeta}/{filename}
     */
    public String guardar(MultipartFile file, String subcarpeta) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        Path dir = Paths.get(uploadDir, subcarpeta);
        Files.createDirectories(dir);

        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID().toString() + ext;

        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        log.info("Archivo guardado: {}", target.toAbsolutePath());

        return "/api/archivos/" + subcarpeta + "/" + filename;
    }

    /**
     * Elimina un archivo aceptando rutas antiguas y nuevas de forma segura.
     */
    public void eliminar(String rutaRelativa) {
        if (rutaRelativa == null || rutaRelativa.isBlank()) {
            return;
        }

        try {
            // Limpiar posibles prefijos (absolutos HTTP, /api/archivos/, rutas previas)
            String limpia = rutaRelativa
                    .replaceFirst("^https?://[^/]+", "")
                    .replaceFirst("^/api/archivos/", "")
                    .replaceFirst("^/imagenes/uploads/", "")
                    .replaceFirst("^/documentos/", "documentos/")
                    .replaceFirst("^uploads/", "")
                    .replaceFirst("^/", "");

            Path base = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = base.resolve(limpia).normalize();

            // Verificación de seguridad contra Path Traversal
            if (!path.startsWith(base)) {
                log.warn("Ruta no autorizada para eliminar fuera de uploadDir: {}", rutaRelativa);
                return;
            }

            boolean deleted = Files.deleteIfExists(path);
            if (deleted) {
                log.info("Archivo eliminado: {}", path.toAbsolutePath());
            } else {
                log.debug("Archivo no existía para eliminar: {}", path.toAbsolutePath());
            }
        } catch (IOException e) {
            log.warn("No se pudo eliminar el archivo: {}", rutaRelativa, e);
        }
    }
}
