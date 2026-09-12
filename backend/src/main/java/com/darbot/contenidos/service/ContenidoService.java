package com.darbot.contenidos.service;

import com.darbot.contenidos.dto.DocumentoRequest;
import com.darbot.contenidos.dto.EventoRequest;
import com.darbot.contenidos.dto.NoticiaRequest;
import com.darbot.contenidos.entity.Documento;
import com.darbot.contenidos.entity.Evento;
import com.darbot.contenidos.entity.Noticia;
import com.darbot.contenidos.repository.DocumentoRepository;
import com.darbot.contenidos.repository.EventoRepository;
import com.darbot.contenidos.repository.NoticiaRepository;
import com.darbot.common.exception.ResourceNotFoundException;
import com.darbot.common.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContenidoService {

    private final NoticiaRepository noticiaRepository;
    private final EventoRepository eventoRepository;
    private final DocumentoRepository documentoRepository;
    private final FileStorageService fileStorageService;

    // ==================== NOTICIAS ====================

    public List<Noticia> obtenerTodasNoticias() {
        return noticiaRepository.findAll();
    }

    public List<Noticia> obtenerNoticiasPublicadas() {
        return noticiaRepository.findByEstadoOrderByFechaPublicacionDesc("PUBLICADA");
    }

    public Noticia obtenerNoticiaPorId(Long id) {
        return noticiaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Noticia no encontrada con id: " + id));
    }

    @Transactional
    public Noticia crearNoticia(NoticiaRequest request) {
        Noticia noticia = new Noticia();
        mapearNoticiaRequestAEntity(request, noticia);
        noticia.setFechaCreacion(LocalDateTime.now());
        noticia.setFechaActualizacion(LocalDateTime.now());
        if (noticia.getFechaPublicacion() == null) {
            noticia.setFechaPublicacion(LocalDateTime.now());
        }
        return noticiaRepository.save(noticia);
    }

    @Transactional
    public Noticia actualizarNoticia(Long id, NoticiaRequest request) {
        Noticia noticiaExistente = obtenerNoticiaPorId(id);
        mapearNoticiaRequestAEntity(request, noticiaExistente);
        noticiaExistente.setFechaActualizacion(LocalDateTime.now());
        return noticiaRepository.save(noticiaExistente);
    }

    @Transactional
    public void eliminarNoticia(Long id) {
        Noticia noticia = obtenerNoticiaPorId(id);
        noticiaRepository.delete(noticia);
    }

    private void mapearNoticiaRequestAEntity(NoticiaRequest request, Noticia entity) {
        if (request.titulo() != null) entity.setTitulo(request.titulo());
        if (request.resumen() != null) entity.setResumen(request.resumen());
        if (request.contenido() != null) entity.setContenido(request.contenido());
        if (request.imagenUrl() != null) entity.setImagenUrl(request.imagenUrl());
        if (request.estado() != null) entity.setEstado(request.estado());
    }

    // ==================== EVENTOS ====================

    public List<Evento> obtenerTodosEventos() {
        return eventoRepository.findAll();
    }

    public List<Evento> obtenerProximosEventos() {
        return eventoRepository.findByFechaGreaterThanEqualOrderByFechaAsc(LocalDate.now());
    }

    public Evento obtenerEventoPorId(Long id) {
        return eventoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Evento no encontrado con id: " + id));
    }

    @Transactional
    public Evento crearEvento(EventoRequest request) {
        Evento evento = new Evento();
        mapearEventoRequestAEntity(request, evento);
        evento.setFechaCreacion(LocalDateTime.now());
        evento.setFechaActualizacion(LocalDateTime.now());
        return eventoRepository.save(evento);
    }

    @Transactional
    public Evento actualizarEvento(Long id, EventoRequest request) {
        Evento eventoExistente = obtenerEventoPorId(id);
        mapearEventoRequestAEntity(request, eventoExistente);
        eventoExistente.setFechaActualizacion(LocalDateTime.now());
        return eventoRepository.save(eventoExistente);
    }

    @Transactional
    public void eliminarEvento(Long id) {
        Evento evento = obtenerEventoPorId(id);
        eventoRepository.delete(evento);
    }

    private void mapearEventoRequestAEntity(EventoRequest request, Evento entity) {
        if (request.titulo() != null) entity.setTitulo(request.titulo());
        if (request.descripcion() != null) entity.setDescripcion(request.descripcion());
        if (request.fecha() != null) entity.setFecha(request.fecha());
        if (request.horaInicio() != null) entity.setHoraInicio(request.horaInicio());
        if (request.horaFin() != null) entity.setHoraFin(request.horaFin());
        if (request.lugar() != null) entity.setLugar(request.lugar());
        if (request.estado() != null) entity.setEstado(request.estado());
    }

    // ==================== DOCUMENTOS ====================

    public List<Documento> obtenerTodosDocumentos() {
        return documentoRepository.findAll();
    }

    public List<Documento> obtenerDocumentosActivos() {
        return documentoRepository.findByEstado("ACTIVO");
    }

    public Documento obtenerDocumentoPorId(Long id) {
        return documentoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Documento no encontrado con id: " + id));
    }

    @Transactional
    public Documento crearDocumento(DocumentoRequest request) {
        Documento documento = new Documento();
        mapearDocumentoRequestAEntity(request, documento);
        documento.setFechaCreacion(LocalDateTime.now());
        documento.setFechaActualizacion(LocalDateTime.now());
        return documentoRepository.save(documento);
    }

    @Transactional
    public Documento actualizarDocumento(Long id, DocumentoRequest request) {
        Documento documentoExistente = obtenerDocumentoPorId(id);
        mapearDocumentoRequestAEntity(request, documentoExistente);
        documentoExistente.setFechaActualizacion(LocalDateTime.now());
        return documentoRepository.save(documentoExistente);
    }

    @Transactional
    public void eliminarDocumento(Long id) {
        Documento documento = obtenerDocumentoPorId(id);
        documentoRepository.delete(documento);
    }

    private void mapearDocumentoRequestAEntity(DocumentoRequest request, Documento entity) {
        if (request.titulo() != null) entity.setTitulo(request.titulo());
        if (request.descripcion() != null) entity.setDescripcion(request.descripcion());
        if (request.nombreArchivo() != null) entity.setNombreArchivo(request.nombreArchivo());
        if (request.rutaArchivo() != null) entity.setRutaArchivo(request.rutaArchivo());
        if (request.tipo() != null) entity.setTipo(request.tipo());
        if (request.estado() != null) entity.setEstado(request.estado());
    }

    // ==================== DOCUMENTOS CON ARCHIVO ====================

    @Transactional
    public Documento crearDocumentoConArchivo(String titulo, String descripcion, String tipo,
                                              MultipartFile archivo) throws IOException {
        String ruta = fileStorageService.guardar(archivo, "documentos");
        Documento documento = new Documento();
        documento.setTitulo(titulo);
        documento.setDescripcion(descripcion);
        documento.setTipo(tipo);
        documento.setNombreArchivo(archivo.getOriginalFilename());
        documento.setRutaArchivo(ruta);
        documento.setEstado("ACTIVO");
        documento.setFechaCreacion(LocalDateTime.now());
        documento.setFechaActualizacion(LocalDateTime.now());
        if (documento.getFechaPublicacion() == null) {
            documento.setFechaPublicacion(LocalDateTime.now());
        }
        return documentoRepository.save(documento);
    }

    @Transactional
    public Documento actualizarDocumentoConArchivo(Long id, String titulo, String descripcion,
                                                    String tipo, MultipartFile archivo) throws IOException {
        Documento doc = obtenerDocumentoPorId(id);
        if (titulo != null) doc.setTitulo(titulo);
        if (descripcion != null) doc.setDescripcion(descripcion);
        if (tipo != null) doc.setTipo(tipo);
        if (archivo != null && !archivo.isEmpty()) {
            // Eliminar archivo anterior
            if (doc.getRutaArchivo() != null) {
                fileStorageService.eliminar(doc.getRutaArchivo());
            }
            String ruta = fileStorageService.guardar(archivo, "documentos");
            doc.setRutaArchivo(ruta);
            doc.setNombreArchivo(archivo.getOriginalFilename());
        }
        doc.setFechaActualizacion(LocalDateTime.now());
        return documentoRepository.save(doc);
    }


}