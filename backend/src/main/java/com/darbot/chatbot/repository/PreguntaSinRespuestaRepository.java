package com.darbot.chatbot.repository;

import com.darbot.chatbot.entity.PreguntaSinRespuesta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PreguntaSinRespuestaRepository extends JpaRepository<PreguntaSinRespuesta, Long> {
	List<PreguntaSinRespuesta> findByResueltaOrderByFechaDesc(Boolean resuelta);
}