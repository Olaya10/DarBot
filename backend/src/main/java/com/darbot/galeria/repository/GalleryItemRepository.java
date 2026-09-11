package com.darbot.galeria.repository;

import com.darbot.galeria.entity.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {
    // Additional query methods can be added if needed
}
