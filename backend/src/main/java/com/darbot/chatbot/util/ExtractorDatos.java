package com.darbot.chatbot.util;

import com.darbot.chatbot.entity.RangoFecha;
import com.darbot.chatbot.repository.RangoFechaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.DateTimeException;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class ExtractorDatos {

    private final RangoFechaRepository rangoFechaRepository;

    private static final Pattern PATRON_FECHA = Pattern.compile(
        "(\\d{1,2}\\s+de\\s+[a-z]+\\s+del?\\s+\\d{4})|" +
        "(\\d{1,2}/\\d{1,2}/\\d{4})|" +
        "(\\d{4}-\\d{1,2}-\\d{1,2})|" +
        "(hoy|manana|pasado manana|ayer)"
    );

    private static final Pattern PATRON_GRADO = Pattern.compile(
        "(preescolar|primero|segundo|tercero|cuarto|quinto|sexto|septimo|octavo|noveno|decimo|undecimo|once?|" +
        "transicion|parvulos|maternal|jardin|prekinder|kinder|" +
        "\\d+\\s*(?:°|º|grado|grados|mo|° grado))"
    );

    private static final Pattern PATRON_HORA = Pattern.compile(
        "(\\d{1,2}:\\d{2}\\s*(?:am|pm)?)|" +
        "(\\d{1,2}\\s*(?:am|pm|de la mañana|de la tarde|de la noche))"
    );

    private static final Pattern PATRON_NUMERO = Pattern.compile("\\d+");

    public Map<String, Object> extraerEntidades(String texto) {
        Map<String, Object> entidades = new HashMap<>();
        String textoLower = texto.toLowerCase(Locale.ROOT);

        // Extraer rango de fechas (del X al Y de mes)
        Map<String, Object> rango = extraerRangoFechas(textoLower);
        if (rango != null && !rango.isEmpty()) {
            entidades.putAll(rango);
        }

        // Extraer fecha simple
        Matcher fechaMatcher = PATRON_FECHA.matcher(textoLower);
        if (fechaMatcher.find()) {
            entidades.put("fecha", fechaMatcher.group());
        }

        // Extraer rango por nombre (hoy, mañana, esta semana, etc.)
        String rangoNombre = extraerRangoPorNombre(textoLower);
        if (rangoNombre != null) {
            entidades.put("rango_nombre", rangoNombre);
            entidades.put("fecha_desde", calcularFechaDesde(rangoNombre));
            entidades.put("fecha_hasta", calcularFechaHasta(rangoNombre));
        }

        // Extraer grados
        Matcher gradoMatcher = PATRON_GRADO.matcher(textoLower);
        if (gradoMatcher.find()) {
            String grado = gradoMatcher.group();
            entidades.put("grado", grado);
            entidades.put("grado_numero", normalizarGrado(grado));
        }

        // Extraer horas
        Matcher horaMatcher = PATRON_HORA.matcher(textoLower);
        if (horaMatcher.find()) {
            entidades.put("hora", horaMatcher.group());
        }

        // Extraer números
        Matcher numeroMatcher = PATRON_NUMERO.matcher(textoLower);
        List<String> numeros = new ArrayList<>();
        while (numeroMatcher.find()) {
            numeros.add(numeroMatcher.group());
        }
        if (!numeros.isEmpty()) {
            entidades.put("numeros", numeros);
        }

        // Detectar tipo de evento
        if (textoLower.contains("reunión") || textoLower.contains("reunion")) {
            entidades.put("tipo_evento", "REUNION");
        } else if (textoLower.contains("taller")) {
            entidades.put("tipo_evento", "TALLER");
        } else if (textoLower.contains("feria")) {
            entidades.put("tipo_evento", "FERIA");
        } else if (textoLower.contains("conferencia")) {
            entidades.put("tipo_evento", "CONFERENCIA");
        }

        return entidades;
    }

    private Map<String, Object> extraerRangoFechas(String texto) {
        Map<String, Object> resultado = new HashMap<>();
        
        // Patrón: "del 15 al 20 de septiembre"
        Matcher m1 = Pattern.compile("del\\s+(\\d{1,2})\\s+al\\s+(\\d{1,2})\\s+de\\s+([a-z]+)").matcher(texto);
        if (m1.find()) {
            int diaInicio = Integer.parseInt(m1.group(1));
            int diaFin = Integer.parseInt(m1.group(2));
            String mes = m1.group(3);
            int mesNum = obtenerMesNumero(mes);
            int año = LocalDate.now().getYear();
            
            try {
                LocalDate fechaDesde = LocalDate.of(año, mesNum, diaInicio);
                LocalDate fechaHasta = LocalDate.of(año, mesNum, diaFin);
                if (fechaDesde.isAfter(fechaHasta)) return Collections.emptyMap();
                resultado.put("fecha_desde", fechaDesde);
                resultado.put("fecha_hasta", fechaHasta);
            } catch (DateTimeException ex) {
                return Collections.emptyMap();
            }
            resultado.put("rango_tipo", "ESPECIFICO");
            return resultado;
        }

        // Patrón: "desde el 15 hasta el 20 de septiembre"
        Matcher m2 = Pattern.compile("desde\\s+el\\s+(\\d{1,2})\\s+hasta\\s+el\\s+(\\d{1,2})\\s+de\\s+([a-z]+)").matcher(texto);
        if (m2.find()) {
            int diaInicio = Integer.parseInt(m2.group(1));
            int diaFin = Integer.parseInt(m2.group(2));
            String mes = m2.group(3);
            int mesNum = obtenerMesNumero(mes);
            int año = LocalDate.now().getYear();
            
            try {
                LocalDate fechaDesde = LocalDate.of(año, mesNum, diaInicio);
                LocalDate fechaHasta = LocalDate.of(año, mesNum, diaFin);
                if (fechaDesde.isAfter(fechaHasta)) return Collections.emptyMap();
                resultado.put("fecha_desde", fechaDesde);
                resultado.put("fecha_hasta", fechaHasta);
            } catch (DateTimeException ex) {
                return Collections.emptyMap();
            }
            resultado.put("rango_tipo", "ESPECIFICO");
            return resultado;
        }

        return null;
    }

    private String extraerRangoPorNombre(String texto) {
        List<RangoFecha> rangos = rangoFechaRepository.findByActivoTrue();
        
        for (RangoFecha rango : rangos) {
            String nombreNormalizado = normalizarSinTildes(rango.getNombre());
            if (texto.contains(nombreNormalizado)) {
                return nombreNormalizado;
            }
        }
        return null;
    }

    private LocalDate calcularFechaDesde(String rangoNombre) {
        LocalDate hoy = LocalDate.now();
        switch (rangoNombre) {
            case "hoy": return hoy;
            case "manana": return hoy.plusDays(1);
            case "esta semana": return hoy;
            case "proxima semana": return hoy.plusDays(7);
            case "este mes": return hoy.withDayOfMonth(1);
            case "proximo mes": return hoy.plusMonths(1).withDayOfMonth(1);
            default: return hoy;
        }
    }

    private LocalDate calcularFechaHasta(String rangoNombre) {
        LocalDate hoy = LocalDate.now();
        switch (rangoNombre) {
            case "hoy": return hoy;
            case "manana": return hoy.plusDays(1);
            case "esta semana": return hoy.plusDays(7);
            case "proxima semana": return hoy.plusDays(14);
            case "este mes": return hoy.withDayOfMonth(hoy.lengthOfMonth());
            case "proximo mes": return hoy.plusMonths(1).withDayOfMonth(hoy.plusMonths(1).lengthOfMonth());
            default: return hoy.plusDays(7);
        }
    }

    private int obtenerMesNumero(String mes) {
        Map<String, Integer> meses = new HashMap<>();
        meses.put("enero", 1); meses.put("febrero", 2); meses.put("marzo", 3);
        meses.put("abril", 4); meses.put("mayo", 5); meses.put("junio", 6);
        meses.put("julio", 7); meses.put("agosto", 8); meses.put("septiembre", 9);
        meses.put("octubre", 10); meses.put("noviembre", 11); meses.put("diciembre", 12);
        return meses.getOrDefault(mes, -1);
    }

    private Integer normalizarGrado(String grado) {
        Map<String, Integer> grados = new HashMap<>();
        grados.put("preescolar", 0);
        grados.put("transicion", 0);
        grados.put("primero", 1);
        grados.put("segundo", 2);
        grados.put("tercero", 3);
        grados.put("cuarto", 4);
        grados.put("quinto", 5);
        grados.put("sexto", 6);
        grados.put("septimo", 7);
        grados.put("octavo", 8);
        grados.put("noveno", 9);
        grados.put("decimo", 10);
        grados.put("undecimo", 11);
        grados.put("once", 11);

        String gradoLower = normalizarSinTildes(grado);
        for (Map.Entry<String, Integer> entry : grados.entrySet()) {
            if (gradoLower.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        try {
            return Integer.parseInt(gradoLower.replaceAll("[^0-9]", ""));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String normalizarSinTildes(String texto) {
        if (texto == null) return "";
        String normalizado = Normalizer.normalize(texto, Normalizer.Form.NFD);
        return normalizado.replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).trim();
    }
}
