package com.darbot.publico.repository;

import com.darbot.publico.entity.EquipoDirectivo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EquipoDirectivoRepository extends JpaRepository<EquipoDirectivo, Long> {

    List<EquipoDirectivo> findByActivoTrueOrderByOrdenAsc();
}
