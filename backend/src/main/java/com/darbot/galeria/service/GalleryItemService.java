package com.darbot.galeria.service;

import com.darbot.common.exception.ResourceNotFoundException;
import com.darbot.common.service.FileStorageService;
import com.darbot.galeria.dto.GalleryItemRequest;
import com.darbot.galeria.entity.GalleryItem;
import com.darbot.galeria.repository.GalleryItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GalleryItemService {

    private final GalleryItemRepository repository;
    private final FileStorageService fileStorageService;

    public List<GalleryItem> listar() {
        return repository.findAll();
    }

    public GalleryItem obtener(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Galería item no encontrado con id: " + id));
    }

    @Transactional
    public GalleryItem crear(GalleryItemRequest request, MultipartFile file) throws IOException {
        GalleryItem item = new GalleryItem();
        item.setTitulo(request.titulo());
        item.setDescripcion(request.descripcion());
        item.setFecha(request.fecha() != null ? request.fecha() : LocalDateTime.now());
        if (file != null && !file.isEmpty()) {
            item.setUrlImagen(fileStorageService.guardar(file, "galeria"));
        }
        if (request.categoria() != null) item.setCategoria(request.categoria());
        if (request.orden() != null) item.setOrden(request.orden());
        if (request.activo() != null) item.setActivo(request.activo());
        if (request.destacado() != null) item.setDestacado(request.destacado());
        return repository.save(item);
    }

    @Transactional
    public GalleryItem actualizar(Long id, GalleryItemRequest request, MultipartFile file) throws IOException {
        GalleryItem item = obtener(id);
        if (request.titulo() != null) item.setTitulo(request.titulo());
        if (request.descripcion() != null) item.setDescripcion(request.descripcion());
        if (request.fecha() != null) item.setFecha(request.fecha());
        if (request.categoria() != null) item.setCategoria(request.categoria());
        if (request.orden() != null) item.setOrden(request.orden());
        if (request.activo() != null) item.setActivo(request.activo());
        if (request.destacado() != null) item.setDestacado(request.destacado());
        if (file != null && !file.isEmpty()) {
            if (item.getUrlImagen() != null) {
                fileStorageService.eliminar(item.getUrlImagen());
            }
            item.setUrlImagen(fileStorageService.guardar(file, "galeria"));
        }
        return repository.save(item);
    }

    @Transactional
    public void eliminar(Long id) {
        GalleryItem item = obtener(id);
        if (item.getUrlImagen() != null) {
            fileStorageService.eliminar(item.getUrlImagen());
        }
        repository.delete(item);
    }
}
