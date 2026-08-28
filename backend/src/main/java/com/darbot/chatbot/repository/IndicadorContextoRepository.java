package com.darbot.chatbot.repository;

import com.darbot.chatbot.entity.IndicadorContexto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IndicadorContextoRepository extends JpaRepository<IndicadorContexto, Long> {
    List<IndicadorContexto> findByActivaTrueOrderByPrioridadDesc();
}