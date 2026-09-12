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
     * Guarda un archivo en uploads/{subcarpeta}/
     * @param file archivo a guardar
     * @param subcarpeta ej: "documentos", "galeria", "equipo"
     * @return ruta relativa para servir desde el frontend (ej: uploads/documentos/uuid.pdf)
     */
    public String guardar(MultipartFile file, String subcarpeta) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo está vacío");
        }

        // Crear directorio si no existe
        Path dir = Paths.get(uploadDir, subcarpeta);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }

        // Generar nombre único
        String original = file.getOriginalFilename();
        String ext = "";
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID().toString() + ext;

        // Guardar
        Path target = dir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        log.info("Archivo guardado: {}", target.toAbsolutePath());

        // Retornar ruta relativa para el frontend
        // Documentos van a /documentos/, imágenes a /imagenes/uploads/
        if ("documentos".equals(subcarpeta)) {
            return "/" + subcarpeta + "/" + filename;
        }
        return "/imagenes/uploads/" + subcarpeta + "/" + filename;
    }

    /**
     * Elimina un archivo
     */
    public void eliminar(String rutaRelativa) {
        try {
            Path path = Paths.get(rutaRelativa);
            Files.deleteIfExists(path);
            log.info("Archivo eliminado: {}", path.toAbsolutePath());
        } catch (IOException e) {
            log.warn("No se pudo eliminar: {}", rutaRelativa, e);
        }
    }
}
