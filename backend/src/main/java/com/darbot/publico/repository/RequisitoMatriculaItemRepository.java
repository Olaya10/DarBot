package com.darbot.publico.repository;

import com.darbot.publico.entity.RequisitoMatriculaItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequisitoMatriculaItemRepository extends JpaRepository<RequisitoMatriculaItem, Long> {
    List<RequisitoMatriculaItem> findByRequisitoMatricula_IdAndActivoTrueOrderByOrdenAsc(Long requisitoId);
}
