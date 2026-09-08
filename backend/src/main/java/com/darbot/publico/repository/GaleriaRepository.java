package com.darbot.publico.repository;

import com.darbot.publico.entity.Galeria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GaleriaRepository extends JpaRepository<Galeria, Long> {
    List<Galeria> findByActivoTrueOrderByOrdenAsc();
    List<Galeria> findByActivoTrueAndCategoriaOrderByOrdenAsc(String categoria);
}
