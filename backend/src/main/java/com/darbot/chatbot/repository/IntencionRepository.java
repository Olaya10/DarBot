package com.darbot.chatbot.repository;

import com.darbot.chatbot.entity.Intencion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IntencionRepository extends JpaRepository<Intencion, Long> {
    List<Intencion> findAllByOrderByPrioridadDesc();
    List<Intencion> findByActivaTrueOrderByPrioridadDesc();
    Optional<Intencion> findByNombre(String nombre);
}