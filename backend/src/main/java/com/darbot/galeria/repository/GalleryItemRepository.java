package com.darbot.galeria.repository;

import com.darbot.galeria.entity.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {

    List<GalleryItem> findByActivoTrueOrderByOrdenAsc();

    List<GalleryItem> findByActivoTrueAndCategoriaOrderByOrdenAsc(String categoria);
}
