package com.darbot.publico.repository;

import com.darbot.publico.entity.Galeria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface GaleriaRepository extends JpaRepository<Galeria, Long> {
    List<Galeria> findByActivoTrueOrderByOrdenAsc();
    List<Galeria> findByActivoTrueAndCategoriaOrderByOrdenAsc(String categoria);
}
