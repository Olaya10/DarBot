package com.darbot.config;

import com.darbot.publico.entity.ConfiguracionSitio;
import com.darbot.publico.entity.Galeria;
import com.darbot.publico.entity.OfertaAcademica;
import com.darbot.publico.repository.ConfiguracionSitioRepository;
import com.darbot.publico.repository.GaleriaRepository;
import com.darbot.publico.repository.OfertaAcademicaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PublicDataInitializer implements CommandLineRunner {

    private final GaleriaRepository galeriaRepository;
    private final OfertaAcademicaRepository ofertaAcademicaRepository;
    private final ConfiguracionSitioRepository configuracionSitioRepository;

    @Override
    public void run(String... args) throws Exception {
        inicializarGaleria();
        inicializarOfertaAcademica();
        inicializarConfiguracion();
    }

    private void inicializarGaleria() {
        if (galeriaRepository.count() > 0) return;

        List<Galeria> items = List.of(
            crearItemGaleria("Actividad pedagógica", "Estudiantes en jornada académica", "academico", "imagenes/galeria1.jpg", 1, true),
            crearItemGaleria("Jornada deportiva", "Encuentro deportivo escolar", "deportes", "imagenes/galeria2.jpg", 2, true),
            crearItemGaleria("Desfile Institucional", "Presentación cultural y desfile", "eventos", "imagenes/galeria3.jpg", 3, true),
            crearItemGaleria("Sala de informática", "Trabajo y tecnología en el aula", "academico", "imagenes/galeria-4.jpg", 4, true),
            crearItemGaleria("Instalaciones", "Actividades en las zonas recreativas", "academico", "imagenes/galeria5.jpg", 5, true),
            crearItemGaleria("Reconocimientos", "Acto oficial de izada de bandera", "cultural", "imagenes/galeria6.jpg", 6, true),
            crearItemGaleria("Evento Cultural", "Presentación artística y folclórica", "cultural", "imagenes/galeria7.jpg", 7, false),
            crearItemGaleria("Torneo Intercolegiado", "Participación en competencias deportivas", "deportes", "imagenes/galeria8.jpg", 8, false),
            crearItemGaleria("Izada de Bandera", "Conmemoración patriótica institucional", "eventos", "imagenes/galeria9.jpg", 9, false),
            crearItemGaleria("Encuentro folclórico", "Muestra de danza y tradición cultural", "cultural", "imagenes/galeria10.jpg", 10, false),
            crearItemGaleria("Encuentro deportivo", "Juegos internos y disciplina", "deportes", "imagenes/galeria11.jpg", 11, false),
            crearItemGaleria("Semillero de ciencia", "Proyectos de innovación y aprendizaje", "academico", "imagenes/galeria12.jpg", 12, false)
        );

        galeriaRepository.saveAll(items);
        log.info("Galería inicializada con {} registros.", items.size());
    }

    private Galeria crearItemGaleria(String titulo, String descripcion, String categoria, String imagenUrl, int orden, boolean destacado) {
        Galeria g = new Galeria();
        g.setTitulo(titulo);
        g.setDescripcion(descripcion);
        g.setCategoria(categoria);
        g.setImagenUrl(imagenUrl);
        g.setOrden(orden);
        g.setActivo(true);
        g.setDestacado(destacado);
        return g;
    }

    private void inicializarOfertaAcademica() {
        if (ofertaAcademicaRepository.count() > 0) return;

        List<OfertaAcademica> ofertas = List.of(
            crearOferta("Preescolar", "preescolar", "Educación inicial con enfoque lúdico y desarrollo socioafectivo.", "preescolar", "fa-solid fa-child-reaching", 1),
            crearOferta("Básica Primaria", "basica-primaria", "Grados 1° a 5° enfocados en competencias lectoras, lógicas y valores.", "primaria", "fa-solid fa-book-open-reader", 2),
            crearOferta("Básica Secundaria", "basica-secundaria", "Grados 6° a 9° con formación científica, humanística y pensamiento crítico.", "secundaria", "fa-solid fa-graduation-cap", 3)
        );

        ofertaAcademicaRepository.saveAll(ofertas);
        log.info("Oferta académica inicializada.");
    }

    private OfertaAcademica crearOferta(String nombre, String slug, String descripcion, String nivel, String icono, int orden) {
        OfertaAcademica o = new OfertaAcademica();
        o.setNombre(nombre);
        o.setSlug(slug);
        o.setDescripcion(descripcion);
        o.setNivel(nivel);
        o.setIcono(icono);
        o.setOrden(orden);
        o.setActivo(true);
        return o;
    }

    private void inicializarConfiguracion() {
        if (configuracionSitioRepository.count() > 0) return;

        List<ConfiguracionSitio> configs = List.of(
            crearConfig("institucion_nombre", "I.E. Darío Torregroza Pérez"),
            crearConfig("institucion_lema", "Camino a la excelencia"),
            crearConfig("direccion", "Calle 18 # Carrera 27, Ciénaga, Magdalena"),
            crearConfig("telefono", "+57 (000) 000 0000"),
            crearConfig("email", "iedariotorregrozaperez@semcienaga.gov.co"),
            crearConfig("facebook", "https://www.facebook.com/iedariotorregroza"),
            crearConfig("instagram", "https://www.instagram.com/iedariotorregroza/")
        );

        configuracionSitioRepository.saveAll(configs);
        log.info("Configuración pública del sitio inicializada.");
    }

    private ConfiguracionSitio crearConfig(String clave, String valor) {
        ConfiguracionSitio c = new ConfiguracionSitio();
        c.setClave(clave);
        c.setValor(valor);
        c.setActivo(true);
        return c;
    }
}
