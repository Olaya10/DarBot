package com.darbot.publico.repository;

import com.darbot.publico.entity.EquipoDirectivo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EquipoDirectivoRepository extends JpaRepository<EquipoDirectivo, Long> {

    List<EquipoDirectivo> findByActivoTrueOrderByOrdenAsc();
}
