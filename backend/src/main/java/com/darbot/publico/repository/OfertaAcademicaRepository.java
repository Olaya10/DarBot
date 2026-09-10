package com.darbot.publico.repository;

import com.darbot.publico.entity.OfertaAcademica;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OfertaAcademicaRepository extends JpaRepository<OfertaAcademica, Long> {
    List<OfertaAcademica> findByActivoTrueOrderByOrdenAsc();
}
