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
        if (intencionRepository.count() > 0) {
            return;
        }

        // 1. CONSULTAR_EVENTOS
        Intencion eventos = crearIntencion("CONSULTAR_EVENTOS", 
            "Consulta sobre eventos, actividades y reuniones", 10);
        agregarPalabrasClave(eventos, Arrays.asList(
            "evento", "eventos", "actividad", "actividades", 
            "reunion", "reuniones", "agenda", "calendario",
            "proximo", "proximos", "feria", "taller"
        ));

        // 2. CONSULTAR_NOTICIAS
        Intencion noticias = crearIntencion("CONSULTAR_NOTICIAS",
            "Consulta sobre noticias, novedades y publicaciones", 9);
        agregarPalabrasClave(noticias, Arrays.asList(
            "noticia", "noticias", "novedad", "novedades",
            "publicacion", "publicaciones", "actualidad",
            "informacion reciente", "boletin"
        ));

        // 3. CONSULTAR_DOCUMENTOS
        Intencion documentos = crearIntencion("CONSULTAR_DOCUMENTOS",
            "Consulta sobre documentos, manuales y formatos", 8);
        agregarPalabrasClave(documentos, Arrays.asList(
            "documento", "documentos", "manual", "manuales",
            "circular", "circulares", "formato", "formatos",
            "archivo", "archivos", "descargar", "pdf",
            "guia", "guias"
        ));

        // 4. CONSULTAR_SEDES
        Intencion sedes = crearIntencion("CONSULTAR_SEDES",
            "Consulta sobre ubicación y datos de sedes", 7);
        agregarPalabrasClave(sedes, Arrays.asList(
            "sede", "sedes", "ubicacion", "ubicación",
            "campus", "direccion", "dirección",
            "donde queda", "donde está"
        ));

        // 5. CONSULTAR_CONTACTOS
        Intencion contactos = crearIntencion("CONSULTAR_CONTACTOS",
            "Consulta sobre contactos, teléfonos y correos", 7);
        agregarPalabrasClave(contactos, Arrays.asList(
            "contacto", "contactos", "telefono", "teléfono",
            "correo", "email", "llamar", "escribir",
            "comunicarse", "mensaje", "whatsapp"
        ));

        // 6. CONSULTAR_HORARIOS
        Intencion horarios = crearIntencion("CONSULTAR_HORARIOS",
            "Consulta sobre horarios de atención", 6);
        agregarPalabrasClave(horarios, Arrays.asList(
            "horario", "horarios", "hora", "atencion", "atención",
            "abre", "abren", "cierra", "cierran",
            "jornada", "turno"
        ));

        // 7. CONSULTAR_SERVICIOS
        Intencion servicios = crearIntencion("CONSULTAR_SERVICIOS",
            "Consulta sobre servicios institucionales", 5);
        agregarPalabrasClave(servicios, Arrays.asList(
            "servicio", "servicios", "biblioteca",
            "cafeteria", "cafetería", "enfermeria", "enfermería",
            "computo", "cómputo"
        ));

        // 8. CONSULTAR_INSTITUCION
        Intencion institucion = crearIntencion("CONSULTAR_INSTITUCION",
            "Consulta sobre información general de la institución", 4);
        agregarPalabrasClave(institucion, Arrays.asList(
            "institucion", "institución", "colegio",
            "informacion", "información", "quienes somos",
            "historia", "mision", "misión", "vision", "visión",
            "valores"
        ));
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
        for (String palabra : palabras) {
            PalabraClaveIntencion pc = new PalabraClaveIntencion();
            pc.setIntencion(intencion);
            pc.setPalabra(palabra.toLowerCase());
            pc.setPeso(1);
            pc.setEsSinonimo(false);
            palabraClaveRepository.save(pc);
        }
    }
}