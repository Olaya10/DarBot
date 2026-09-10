package com.darbot.publico.repository;

import com.darbot.publico.entity.RequisitoMatriculaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RequisitoMatriculaItemRepository extends JpaRepository<RequisitoMatriculaItem, Long> {
    List<RequisitoMatriculaItem> findByRequisitoMatricula_IdAndActivoTrueOrderByOrdenAsc(Long requisitoId);
}
