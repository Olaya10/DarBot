package com.darbot.publico.repository;

import com.darbot.publico.entity.ConfiguracionSitio;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConfiguracionSitioRepository extends JpaRepository<ConfiguracionSitio, Long> {
    Optional<ConfiguracionSitio> findByClaveAndActivoTrue(String clave);
    List<ConfiguracionSitio> findByActivoTrueOrderByClaveAsc();
}
