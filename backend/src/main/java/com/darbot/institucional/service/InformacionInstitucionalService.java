package com.darbot.institucional.service;

import com.darbot.institucional.dto.InformacionInstitucionalRequest;
import com.darbot.institucional.entity.InformacionInstitucional;
import com.darbot.institucional.repository.InformacionInstitucionalRepository;
import com.darbot.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InformacionInstitucionalService {

    private final InformacionInstitucionalRepository repository;

    public InformacionInstitucional obtenerInformacion() {
        return repository.findAll().stream().findFirst().orElse(null);
    }

    public InformacionInstitucional obtenerPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Información institucional no encontrada con id: " + id));
    }

    public List<InformacionInstitucional> obtenerTodas() {
        return repository.findAll();
    }

    @Transactional
    public InformacionInstitucional crear(InformacionInstitucionalRequest request) {
        InformacionInstitucional info = new InformacionInstitucional();
        mapearRequestAEntity(request, info);
        info.setFechaCreacion(LocalDateTime.now());
        info.setFechaActualizacion(LocalDateTime.now());
        return repository.save(info);
    }

    @Transactional
    public InformacionInstitucional actualizar(Long id, InformacionInstitucionalRequest request) {
        InformacionInstitucional infoExistente = obtenerPorId(id);
        mapearRequestAEntity(request, infoExistente);
        infoExistente.setFechaActualizacion(LocalDateTime.now());
        return repository.save(infoExistente);
    }

    @Transactional
    public InformacionInstitucional guardarOActualizar(InformacionInstitucionalRequest request) {
        InformacionInstitucional existente = obtenerInformacion();
        if (existente != null) {
            return actualizar(existente.getId(), request);
        }
        return crear(request);
    }

    @Transactional
    public void eliminar(Long id) {
        InformacionInstitucional info = obtenerPorId(id);
        repository.delete(info);
    }

    private void mapearRequestAEntity(InformacionInstitucionalRequest request, InformacionInstitucional entity) {
        if (request.nombre() != null) entity.setNombre(request.nombre());
        if (request.historia() != null) entity.setHistoria(request.historia());
        if (request.mision() != null) entity.setMision(request.mision());
        if (request.vision() != null) entity.setVision(request.vision());
        if (request.valores() != null) entity.setValores(request.valores());
        if (request.filosofia() != null) entity.setFilosofia(request.filosofia());
        if (request.descripcion() != null) entity.setDescripcion(request.descripcion());
        if (request.logoUrl() != null) entity.setLogoUrl(request.logoUrl());
        if (request.nombreInstitucion() != null) entity.setNombreInstitucion(request.nombreInstitucion());
        if (request.telefonoGeneral() != null) entity.setTelefonoGeneral(request.telefonoGeneral());
        if (request.correoGeneral() != null) entity.setCorreoGeneral(request.correoGeneral());
        if (request.sitioWeb() != null) entity.setSitioWeb(request.sitioWeb());
    }
}