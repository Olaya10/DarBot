package com.darbot.publico.repository;

import com.darbot.publico.entity.OfertaAcademica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfertaAcademicaRepository extends JpaRepository<OfertaAcademica, Long> {
    List<OfertaAcademica> findByActivoTrueOrderByOrdenAsc();
}
