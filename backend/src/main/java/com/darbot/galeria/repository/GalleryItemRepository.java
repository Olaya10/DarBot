package com.darbot.galeria.repository;

import com.darbot.galeria.entity.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {

    List<GalleryItem> findByActivoTrueOrderByOrdenAsc();

    List<GalleryItem> findByActivoTrueAndCategoriaOrderByOrdenAsc(String categoria);
}
