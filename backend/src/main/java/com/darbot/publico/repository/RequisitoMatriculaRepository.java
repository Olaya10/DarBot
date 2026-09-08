package com.darbot.publico.repository;

import com.darbot.publico.entity.RequisitoMatricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RequisitoMatriculaRepository extends JpaRepository<RequisitoMatricula, Long> {
    List<RequisitoMatricula> findByActivoTrueOrderByOrdenAsc();
}
