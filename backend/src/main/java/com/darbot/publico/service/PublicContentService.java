package com.darbot.publico.service;

import com.darbot.publico.dto.*;
import com.darbot.publico.entity.*;
import com.darbot.publico.repository.*;
import com.darbot.chatbot.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicContentService {

    private final OfertaAcademicaRepository ofertaAcademicaRepository;
    private final GaleriaRepository galeriaRepository;
    private final RequisitoMatriculaRepository requisitoMatriculaRepository;
    private final RequisitoMatriculaItemRepository requisitoMatriculaItemRepository;
    private final PreinscripcionRepository preinscripcionRepository;
    private final ConfiguracionSitioRepository configuracionSitioRepository;
    private final EstadisticaRepository estadisticaRepository;
    private final FaqRepository faqRepository;

    @Transactional(readOnly = true)
    public List<OfertaAcademicaResponse> obtenerOfertaAcademica() {
        return ofertaAcademicaRepository.findByActivoTrueOrderByOrdenAsc().stream()
                .map(OfertaAcademicaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GaleriaResponse> obtenerGaleria(String categoria) {
        List<Galeria> galerias;
        if (categoria == null || categoria.isBlank()) {
            galerias = galeriaRepository.findByActivoTrueOrderByOrdenAsc();
        } else {
            galerias = galeriaRepository.findByActivoTrueAndCategoriaOrderByOrdenAsc(categoria.trim().toLowerCase());
        }
        return galerias.stream().map(GaleriaResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<RequisitoMatriculaResponse> obtenerRequisitosMatricula() {
        return requisitoMatriculaRepository.findByActivoTrueOrderByOrdenAsc().stream()
                .map(requisito -> {
                    List<RequisitoMatriculaItemResponse> items = requisitoMatriculaItemRepository
                            .findByRequisitoMatricula_IdAndActivoTrueOrderByOrdenAsc(requisito.getId())
                            .stream()
                            .map(RequisitoMatriculaItemResponse::from)
                            .toList();
                    return RequisitoMatriculaResponse.from(requisito, items);
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, String> obtenerConfiguracion() {
        return configuracionSitioRepository.findByActivoTrueOrderByClaveAsc().stream()
                .collect(Collectors.toMap(
                        ConfiguracionSitio::getClave,
                        item -> item.getValor() == null ? "" : item.getValor(),
                        (existing, replacement) -> replacement,
                        LinkedHashMap::new
                ));
    }

    @Transactional
    public PreinscripcionResponse crearPreinscripcion(PreinscripcionRequest request) {
        Preinscripcion preinscripcion = new Preinscripcion();
        preinscripcion.setNombres(request.nombres().trim());
        preinscripcion.setApellidos(request.apellidos().trim());
        preinscripcion.setTipoDocumento(request.tipoDocumento().trim());
        preinscripcion.setNumeroDocumento(request.numeroDocumento().trim());
        preinscripcion.setFechaNacimiento(request.fechaNacimiento());
        preinscripcion.setEmail(request.email() != null ? request.email().trim() : null);
        preinscripcion.setTelefono(request.telefono() != null ? request.telefono().trim() : null);
        preinscripcion.setNivelInteres(request.nivelInteres().trim());
        preinscripcion.setSede(request.sede() != null ? request.sede().trim() : null);
        preinscripcion.setObservaciones(request.observaciones() != null ? request.observaciones().trim() : null);
        preinscripcion.setEstado(request.estado() != null ? request.estado().trim() : "pendiente");

        Preinscripcion guardada = preinscripcionRepository.save(preinscripcion);
        return PreinscripcionResponse.from(guardada);
    }

    @Transactional(readOnly = true)
    public List<FaqResponse> obtenerFaqs() {
        return faqRepository.findByActivaTrue().stream()
                .map(FaqResponse::from)
                .toList();
    }

    public List<EstadisticaResponse> obtenerEstadisticas() {
        return estadisticaRepository.findByActivoTrueOrderByOrdenAsc()
            .stream()
            .map(EstadisticaResponse::from)
            .toList();
    }
}
