package com.darbot.publico.repository;

import com.darbot.publico.entity.ConfiguracionSitio;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;

public interface ConfiguracionSitioRepository extends JpaRepository<ConfiguracionSitio, Long> {
    Optional<ConfiguracionSitio> findByClaveAndActivoTrue(String clave);
    List<ConfiguracionSitio> findByActivoTrueOrderByClaveAsc();
}
