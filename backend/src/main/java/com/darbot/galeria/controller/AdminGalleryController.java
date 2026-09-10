package com.darbot.galeria.controller;

import com.darbot.galeria.dto.GalleryItemRequest;
import com.darbot.galeria.dto.GalleryItemResponse;
import com.darbot.galeria.entity.GalleryItem;
import com.darbot.galeria.service.GalleryItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/galeria")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminGalleryController {

    private final GalleryItemService galleryItemService;

    @GetMapping
    public ResponseEntity<List<GalleryItemResponse>> list() {
        List<GalleryItemResponse> resp = galleryItemService.listar()
                .stream()
                .map(GalleryItemResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GalleryItemResponse> get(@PathVariable Long id) {
        GalleryItem item = galleryItemService.obtener(id);
        return ResponseEntity.ok(GalleryItemResponse.from(item));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<GalleryItemResponse> create(@Valid @ModelAttribute GalleryItemRequest request,
                                                      @RequestParam("file") MultipartFile file) throws IOException {
        GalleryItem created = galleryItemService.crear(request, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(GalleryItemResponse.from(created));
    }

    @PutMapping(path = "/{id}", consumes = {"multipart/form-data"})
    public ResponseEntity<GalleryItemResponse> update(@PathVariable Long id,
                                                      @Valid @ModelAttribute GalleryItemRequest request,
                                                      @RequestParam(value = "file", required = false) MultipartFile file) throws IOException {
        GalleryItem updated = galleryItemService.actualizar(id, request, file);
        return ResponseEntity.ok(GalleryItemResponse.from(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        galleryItemService.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
