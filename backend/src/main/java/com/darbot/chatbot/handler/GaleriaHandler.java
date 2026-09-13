package com.darbot.chatbot.handler;

import com.darbot.chatbot.dto.ResultadoChatbot;
import com.darbot.galeria.entity.GalleryItem;
import com.darbot.galeria.repository.GalleryItemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class GaleriaHandler implements IntencionHandler {

    private final GalleryItemRepository galeriaRepository;

    @Override
    public ResultadoChatbot procesar(String texto, Map<String, Object> entidades, String elementoNegado) {
        log.info("GaleriaHandler - procesando consulta");

        List<GalleryItem> imagenes = galeriaRepository.findByActivoTrueOrderByOrdenAsc();

        if (imagenes.isEmpty()) {
            return new ResultadoChatbot("CONSULTAR_GALERIA",
                "Actualmente no hay imágenes en la galería.");
        }

        String textoLower = texto.toLowerCase();
        List<GalleryItem> filtradas = imagenes;

        // Filtrar por categoría
        String[] categorias = {"academico", "deportes", "cultural", "eventos"};
        for (String cat : categorias) {
            if (textoLower.contains(cat)) {
                filtradas = imagenes.stream()
                    .filter(i -> cat.equalsIgnoreCase(i.getCategoria()))
                    .collect(Collectors.toList());
                break;
            }
        }

        // Filtrar por "destacadas"
        if (textoLower.contains("destacada") || textoLower.contains("mejores")) {
            filtradas = imagenes.stream()
                .filter(i -> Boolean.TRUE.equals(i.getDestacado()))
                .collect(Collectors.toList());
        }

        if (filtradas.isEmpty()) filtradas = imagenes;

        // Agrupar por categoría
        Map<String, Long> porCategoria = imagenes.stream()
            .collect(Collectors.groupingBy(
                i -> i.getCategoria() != null ? i.getCategoria() : "otros",
                Collectors.counting()
            ));

        String mensaje = "📸 Tenemos " + imagenes.size() + " imágenes en nuestra galería.\n\n" +
            "Categorías disponibles:\n" +
            porCategoria.entrySet().stream()
                .map(e -> "• " + capitalizar(e.getKey()) + ": " + e.getValue() + " imágenes")
                .collect(Collectors.joining("\n")) +
            "\n\n🔗 Puedes verlas todas aquí: galeria.html";

        ResultadoChatbot resultado = new ResultadoChatbot("CONSULTAR_GALERIA", mensaje);

        // Mostrar máximo 6 imágenes
        filtradas.stream().limit(6).forEach(i -> {
            Map<String, Object> item = new HashMap<>();
            item.put("titulo", i.getTitulo());
            if (i.getUrlImagen() != null) item.put("imagenUrl", i.getUrlImagen());
            item.put("categoria", i.getCategoria());
            resultado.getResultados().add(item);
        });

        resultado.setOpciones(Arrays.asList("Ver galería completa", "Ver fotos de deportes", "Ver fotos culturales"));
        
        return resultado;
    }

    private String capitalizar(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    }

    @Override
    public String getIntencion() {
        return "CONSULTAR_GALERIA";
    }
}
