package com.darbot.publico.repository;

import com.darbot.publico.entity.ValorInstitucional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ValorInstitucionalRepository extends JpaRepository<ValorInstitucional, Long> {

    List<ValorInstitucional> findByActivoTrueOrderByOrdenAsc();
}
