package com.darbot.publico.repository;

import com.darbot.publico.entity.Estadistica;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EstadisticaRepository extends JpaRepository<Estadistica, Long> {

    List<Estadistica> findByActivoTrueOrderByOrdenAsc();
}