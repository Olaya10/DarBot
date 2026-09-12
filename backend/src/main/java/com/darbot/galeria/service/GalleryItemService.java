package com.darbot.galeria.service;

import com.darbot.galeria.dto.GalleryItemRequest;
import com.darbot.galeria.entity.GalleryItem;
import com.darbot.galeria.repository.GalleryItemRepository;
import com.darbot.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GalleryItemService {

    private final GalleryItemRepository repository;
    private final Path uploadDir = Path.of("uploads/galeria");

    public List<GalleryItem> listar() {
        return repository.findAll();
    }

    public GalleryItem obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Galería item no encontrado con id: " + id));
    }

    @Transactional
    public GalleryItem crear(GalleryItemRequest request, MultipartFile file) throws IOException {
        ensureUploadDir();
        String filename = storeFile(file);
        GalleryItem item = new GalleryItem();
        item.setTitulo(request.titulo());
        item.setDescripcion(request.descripcion());
        item.setFecha(request.fecha() != null ? request.fecha() : LocalDateTime.now());
        item.setUrlImagen("/imagenes/uploads/" + filename);
        return repository.save(item);
    }

    @Transactional
    public GalleryItem actualizar(Long id, GalleryItemRequest request, MultipartFile file) throws IOException {
        ensureUploadDir();
        GalleryItem item = obtener(id);
        if (request.titulo() != null) item.setTitulo(request.titulo());
        if (request.descripcion() != null) item.setDescripcion(request.descripcion());
        if (request.fecha() != null) item.setFecha(request.fecha());
        if (file != null && !file.isEmpty()) {
            String filename = storeFile(file);
            item.setUrlImagen("/imagenes/uploads/" + filename);
        }
        return repository.save(item);
    }

    @Transactional
    public void eliminar(Long id) {
        repository.deleteById(id);
    }

    private void ensureUploadDir() throws IOException {
        if (!Files.exists(uploadDir)) {
            Files.createDirectories(uploadDir);
        }
    }

    private String storeFile(MultipartFile file) throws IOException {
        String ext = "";
        String original = file.getOriginalFilename();
        if (original != null && original.contains(".")) {
            ext = original.substring(original.lastIndexOf('.'));
        }
        String filename = UUID.randomUUID().toString() + ext;
        Path target = uploadDir.resolve(filename);
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}
