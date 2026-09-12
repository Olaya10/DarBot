package com.darbot.publico.repository;

import com.darbot.publico.entity.ValorInstitucional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ValorInstitucionalRepository extends JpaRepository<ValorInstitucional, Long> {

    List<ValorInstitucional> findByActivoTrueOrderByOrdenAsc();
}
