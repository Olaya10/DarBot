package com.darbot.publico.repository;

import com.darbot.publico.entity.Preinscripcion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PreinscripcionRepository extends JpaRepository<Preinscripcion, Long> {
}
