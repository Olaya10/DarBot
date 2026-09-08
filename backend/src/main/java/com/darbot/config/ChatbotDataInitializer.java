package com.darbot.config;

import com.darbot.chatbot.entity.Intencion;
import com.darbot.chatbot.entity.PalabraClaveIntencion;
import com.darbot.chatbot.repository.IntencionRepository;
import com.darbot.chatbot.repository.PalabraClaveIntencionRepository;
import com.darbot.usuarios.entity.Rol;
import com.darbot.usuarios.repository.RolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatbotDataInitializer implements CommandLineRunner {

    private final IntencionRepository intencionRepository;
    private final PalabraClaveIntencionRepository palabraClaveRepository;
    private final RolRepository rolRepository;

    @Override
    public void run(String... args) throws Exception {
        crearRolesSiNoExisten();
        crearIntencionesSiNoExisten();
    }

    private void crearRolesSiNoExisten() {
        crearRolSiNoExiste("USER");
        crearRolSiNoExiste("ADMIN");
    }

    private void crearRolSiNoExiste(String nombre) {
        if (rolRepository.findByNombre(nombre).isEmpty()) {
            Rol rol = new Rol();
            rol.setNombre(nombre);
            rolRepository.save(rol);
        }
    }

    private void crearIntencionesSiNoExisten() {
        // 1. CONSULTAR_EVENTOS
        Intencion eventos = crearIntencionSiNoExiste("CONSULTAR_EVENTOS", 
            "Consulta sobre eventos, actividades y reuniones", 10, Arrays.asList(
            "evento", "eventos", "actividad", "actividades", 
            "reunion", "reuniones", "agenda", "calendario",
            "proximo", "proximos", "feria", "taller"
        ));

        // 2. CONSULTAR_NOTICIAS
        Intencion noticias = crearIntencionSiNoExiste("CONSULTAR_NOTICIAS",
            "Consulta sobre noticias, novedades y publicaciones", 9, Arrays.asList(
            "noticia", "noticias", "novedad", "novedades",
            "publicacion", "publicaciones", "actualidad",
            "informacion reciente", "boletin"
        ));

        // 3. CONSULTAR_DOCUMENTOS
        Intencion documentos = crearIntencionSiNoExiste("CONSULTAR_DOCUMENTOS",
            "Consulta sobre documentos, manuales y formatos", 8, Arrays.asList(
            "documento", "documentos", "manual", "manuales",
            "circular", "circulares", "formato", "formatos",
            "archivo", "archivos", "descargar", "pdf",
            "guia", "guias"
        ));

        // 4. CONSULTAR_SEDES
        Intencion sedes = crearIntencionSiNoExiste("CONSULTAR_SEDES",
            "Consulta sobre ubicación y datos de sedes", 7, Arrays.asList(
            "sede", "sedes", "ubicacion", "ubicación",
            "campus", "direccion", "dirección",
            "donde queda", "donde está"
        ));

        // 5. CONSULTAR_CONTACTOS
        Intencion contactos = crearIntencionSiNoExiste("CONSULTAR_CONTACTOS",
            "Consulta sobre contactos, teléfonos y correos", 7, Arrays.asList(
            "contacto", "contactos", "telefono", "teléfono",
            "correo", "email", "llamar", "escribir",
            "comunicarse", "mensaje", "whatsapp"
        ));

        // 6. CONSULTAR_HORARIOS
        Intencion horarios = crearIntencionSiNoExiste("CONSULTAR_HORARIOS",
            "Consulta sobre horarios de atención", 6, Arrays.asList(
            "horario", "horarios", "hora", "atencion", "atención",
            "abre", "abren", "cierra", "cierran",
            "jornada", "turno"
        ));

        // 7. CONSULTAR_SERVICIOS
        Intencion servicios = crearIntencionSiNoExiste("CONSULTAR_SERVICIOS",
            "Consulta sobre servicios institucionales", 5, Arrays.asList(
            "servicio", "servicios", "biblioteca",
            "cafeteria", "cafetería", "enfermeria", "enfermería",
            "computo", "cómputo"
        ));

        // 8. CONSULTAR_INSTITUCION
        Intencion institucion = crearIntencionSiNoExiste("CONSULTAR_INSTITUCION",
            "Consulta sobre información general de la institución", 4, Arrays.asList(
            "institucion", "institución", "colegio",
            "informacion", "información", "quienes somos",
            "historia", "mision", "misión", "vision", "visión",
            "valores"
        ));

        // 9. CONSULTAR_MATRICULA
        Intencion matricula = crearIntencionSiNoExiste("CONSULTAR_MATRICULA",
            "Consulta sobre requisitos, proceso y preinscripción de matrícula", 12, Arrays.asList(
            "matricula", "matrícula", "matricular", "matricularme", "matricularse",
            "requisitos", "requisito", "preinscripcion", "preinscripción",
            "inscripcion", "inscripción", "admisiones", "admisión",
            "documentos para matricula", "documentos para matrícula", "cupo"
        ));

        // 10. CONSULTAR_OFERTA_ACADEMICA
        Intencion oferta = crearIntencionSiNoExiste("CONSULTAR_OFERTA_ACADEMICA",
            "Consulta sobre la oferta académica, programas y niveles", 11, Arrays.asList(
            "oferta academica", "oferta académica", "oferta", "programa",
            "programas", "nivel", "niveles", "preescolar", "primaria",
            "secundaria", "cursos", "formacion"
        ));
    }

    private Intencion crearIntencionSiNoExiste(String nombre, String descripcion, int prioridad, List<String> palabras) {
        return intencionRepository.findByNombre(nombre)
            .map(intencion -> {
                intencion.setDescripcion(descripcion);
                intencion.setPrioridad(prioridad);
                intencion.setActiva(true);
                return intencionRepository.save(intencion);
            })
            .orElseGet(() -> {
                Intencion intencion = crearIntencion(nombre, descripcion, prioridad);
                agregarPalabrasClave(intencion, palabras);
                return intencion;
            });
    }

    private Intencion crearIntencion(String nombre, String descripcion, int prioridad) {
        Intencion intencion = new Intencion();
        intencion.setNombre(nombre);
        intencion.setDescripcion(descripcion);
        intencion.setPrioridad(prioridad);
        intencion.setActiva(true);
        return intencionRepository.save(intencion);
    }

    private void agregarPalabrasClave(Intencion intencion, List<String> palabras) {
        List<String> palabrasExistentes = palabraClaveRepository.findByIntencionId(intencion.getId())
            .stream()
            .map(PalabraClaveIntencion::getPalabra)
            .toList();

        for (String palabra : palabras) {
            if (palabrasExistentes.contains(palabra.toLowerCase())) {
                continue;
            }
            PalabraClaveIntencion pc = new PalabraClaveIntencion();
            pc.setIntencion(intencion);
            pc.setPalabra(palabra.toLowerCase());
            pc.setPeso(1);
            pc.setEsSinonimo(false);
            palabraClaveRepository.save(pc);
        }
    }
}