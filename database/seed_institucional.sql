BEGIN;

-- FASE 1: Información institucional y contacto
INSERT INTO informacion_institucional (
    nombre,
    descripcion,
    historia,
    mision,
    vision,
    valores,
    filosofia,
    logo_url,
    nombre_institucion,
    telefono_general,
    correo_general,
    sitio_web
)
SELECT
    'I.E. Darío Torregroza Pérez',
    'Institución educativa comprometida con la formación integral de niñas, niños y jóvenes.',
    'La Institución Educativa Darío Torregroza Pérez nació con el propósito de servir a la comunidad educativa con calidad, respeto y sentido de pertenencia.',
    'Formar personas críticas, competentes, respetuosas y comprometidas con su entorno.',
    'Ser una institución reconocida por su excelencia académica, sentido humano y formación integral.',
    'Respeto, responsabilidad, tolerancia, honestidad y compromiso social.',
    'La filosofía institucional se centra en el aprendizaje significativo, la inclusión y la formación ciudadana.',
    'imagenes/Logo IEDTP.jpeg',
    'I.E. Darío Torregroza Pérez',
    '+57 300 000 0000',
    'contacto@iedtp.edu.co',
    'https://www.iedtp.edu.co'
WHERE NOT EXISTS (
    SELECT 1 FROM informacion_institucional
    WHERE nombre_institucion = 'I.E. Darío Torregroza Pérez'
);

INSERT INTO sedes (nombre, direccion, telefono, jornada, descripcion, horario_atencion, activa)
SELECT v.nombre, v.direccion, v.telefono, v.jornada, v.descripcion, v.horario_atencion, TRUE
FROM (
    VALUES
        (
            'Sede Principal',
            'Calle 18 # Carrera 27, Ciénaga, Magdalena',
            '+57 300 000 0000',
            'Mañana',
            'Sede principal de la institución, enfocada en educación básica y media.',
            'Lunes a viernes de 7:30 a 12:00'
        ),
        (
            'Sede de Atención',
            'Barrio El Poblado, Ciénaga, Magdalena',
            '+57 301 000 0001',
            'Tarde',
            'Sede de apoyo para atención administrativa y actividades complementarias.',
            'Lunes a viernes de 12:30 a 17:00'
        )
) AS v(nombre, direccion, telefono, jornada, descripcion, horario_atencion)
WHERE NOT EXISTS (
    SELECT 1 FROM sedes
    WHERE nombre = v.nombre AND direccion = v.direccion
);

INSERT INTO areas (nombre, descripcion, activo)
SELECT v.nombre, v.descripcion, TRUE
FROM (
    VALUES
        ('Rectoría', 'Dirección administrativa y académica institucional.', TRUE),
        ('Secretaría', 'Atención a padres, estudiantes y trámites institucionales.', TRUE),
        ('Coordinación', 'Apoyo pedagógico y coordinación académica.', TRUE)
) AS v(nombre, descripcion, activo)
WHERE NOT EXISTS (SELECT 1 FROM areas WHERE nombre = v.nombre);

INSERT INTO contactos (area_id, tipo, valor, descripcion, activo)
SELECT a.id, v.tipo, v.valor, v.descripcion, TRUE
FROM areas a
CROSS JOIN (
    VALUES
        ('Telefono', '+57 300 000 0000', 'Línea general de la institución', 'Rectoría'),
        ('Correo', 'rectoria@iedtp.edu.co', 'Correo institucional de rectoría', 'Rectoría'),
        ('Telefono', '+57 301 000 0001', 'Línea de atención administrativa', 'Secretaría'),
        ('Correo', 'secretaria@iedtp.edu.co', 'Correo de atención a padres y estudiantes', 'Secretaría'),
        ('Horario', 'Lunes a viernes 7:30 a 12:00', 'Horario de atención presencial', 'Secretaría')
) AS v(tipo, valor, descripcion, area_name)
WHERE a.nombre = v.area_name
AND NOT EXISTS (
    SELECT 1 FROM contactos c
    WHERE c.area_id = a.id AND c.tipo = v.tipo AND c.valor = v.valor
);

-- FASE 2: Configuración general del sitio y oferta académica
INSERT INTO configuracion_sitio (clave, valor, tipo, activo)
VALUES
    ('institucion_nombre', 'I.E. Darío Torregroza Pérez', 'string', TRUE),
    ('institucion_lema', 'Camino a la excelencia', 'string', TRUE),
    ('direccion', 'Calle 18 # Carrera 27, Ciénaga, Magdalena', 'string', TRUE),
    ('telefono', '+57 (300) 000 0000', 'string', TRUE),
    ('email', 'contacto@iedtp.edu.co', 'string', TRUE),
    ('facebook', 'https://www.facebook.com/iedariotorregroza?locale=es_LA', 'string', TRUE),
    ('instagram', '', 'string', TRUE),
    ('youtube', '', 'string', TRUE),
    ('logo_url', 'imagenes/Logo IEDTP.jpeg', 'string', TRUE),
    ('mapa_embed', 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d7832.815996496644!2d-74.25793822229005!3d11.007983999999993!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8ef455e138610aa3%3A0xc6aa8d56c04dfaf0!2sInstitucion%20Educativa%20Dario%20Torregroza%20Perez!5e0!3m2!1ses-419!2sco!4v1786024664848!5m2!1ses-419!2sco', 'textarea', TRUE)
ON CONFLICT (clave) DO UPDATE SET
    valor = EXCLUDED.valor,
    tipo = EXCLUDED.tipo,
    activo = EXCLUDED.activo,
    fecha_actualizacion = CURRENT_TIMESTAMP;

INSERT INTO oferta_academica (nombre, slug, descripcion, nivel, icono, orden, activo)
VALUES
    ('Preescolar', 'preescolar', 'Ambiente seguro y pedagógico para despertar la curiosidad, creatividad y autonomía.', 'preescolar', 'fa-seedling', 1, TRUE),
    ('Básica Primaria', 'basica-primaria', 'Formación integral con enfoque académico, social y valorativo.', 'primaria', 'fa-book-open-reader', 2, TRUE),
    ('Básica Secundaria', 'basica-secundaria', 'Desarrollo cognitivo, emocional y académico con mirada crítica e investigativa.', 'secundaria', 'fa-graduation-cap', 3, TRUE)
ON CONFLICT (slug) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    nivel = EXCLUDED.nivel,
    icono = EXCLUDED.icono,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo,
    fecha_actualizacion = CURRENT_TIMESTAMP;

INSERT INTO requisitos_matricula (nivel, titulo, descripcion, orden, activo)
VALUES
    ('preescolar', 'Documentos requeridos para matrícula de Preescolar', 'Requisitos básicos para la inscripción y formalización del proceso.', 1, TRUE),
    ('primaria', 'Documentos requeridos para matrícula de Primaria y Secundaria', 'Requisitos básicos para la inscripción y formalización del proceso.', 2, TRUE)
ON CONFLICT (nivel) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo,
    fecha_actualizacion = CURRENT_TIMESTAMP;

INSERT INTO requisitos_matricula_item (requisito_id, texto, orden, activo)
SELECT rm.id, v.texto, v.orden, TRUE
FROM requisitos_matricula rm
CROSS JOIN (
    VALUES
        ('Registro civil de nacimiento del menor (copia)', 1),
        ('Fotocopia de la cédula del acudiente.', 2),
        ('Certificado o constancia de afiliación al FOSYGA/EPS.', 3),
        ('Constancia del Sisbén.', 4),
        ('Copia del certificado de vacunas.', 5),
        ('Recibo de servicios públicos.', 6),
        ('Carpeta plástica tamaño oficio con gancho.', 7)
) AS v(texto, orden)
WHERE rm.nivel = 'preescolar'
ON CONFLICT (requisito_id, texto) DO NOTHING;

INSERT INTO requisitos_matricula_item (requisito_id, texto, orden, activo)
SELECT rm.id, v.texto, v.orden, TRUE
FROM requisitos_matricula rm
CROSS JOIN (
    VALUES
        ('Boletín con informe final del año anterior aprobado.', 1),
        ('Registro civil o tarjeta de identidad.', 2),
        ('Fotocopia de la cédula del acudiente.', 3),
        ('Certificado o constancia de afiliación al FOSYGA/EPS.', 4),
        ('Constancia del Sisbén.', 5),
        ('Recibo de servicios públicos.', 6),
        ('Carpeta plástica tamaño oficio con gancho.', 7)
) AS v(texto, orden)
WHERE rm.nivel = 'primaria'
ON CONFLICT (requisito_id, texto) DO NOTHING;

-- FASE 3: Galería institucional
INSERT INTO galeria (titulo, descripcion, categoria, imagen_url, orden, activo, destacado)
VALUES
    ('Actividad académica en el aula', 'Actividad en el aula de clase', 'academico', 'imagenes/galeria1.jpg', 1, TRUE, TRUE),
    ('Jornada deportiva estudiantil', 'Evento deportivo institucional', 'deportes', 'imagenes/galeria2.jpg', 2, TRUE, FALSE),
    ('Presentación cultural institucional', 'Desfile y presentación cultural', 'eventos', 'imagenes/galeria3.jpg', 3, TRUE, FALSE),
    ('Trabajo en la sala de informática', 'Aprendizaje con tecnología', 'academico', 'imagenes/galeria-4.jpg', 4, TRUE, FALSE),
    ('Actividad en la cubierta escolar', 'Espacios de aprendizaje institucional', 'academico', 'imagenes/galeria5.jpg', 5, TRUE, FALSE),
    ('Acto de izada de bandera', 'Reconocimientos y ceremonias', 'cultural', 'imagenes/galeria6.jpg', 6, TRUE, FALSE),
    ('Presentación cultural', 'Evento cultural escolar', 'cultural', 'imagenes/galeria7.jpg', 7, TRUE, FALSE),
    ('Torneo de fútbol', 'Competencias deportivas estudiantiles', 'deportes', 'imagenes/galeria8.jpg', 8, TRUE, FALSE),
    ('Izada de bandera', 'Ceremonia institucional', 'eventos', 'imagenes/galeria9.jpg', 9, TRUE, FALSE),
    ('Encuentro folclórico y cultural', 'Celebración cultural de la comunidad', 'cultural', 'imagenes/galeria10.jpg', 10, TRUE, FALSE),
    ('Encuentro deportivo', 'Competencia deportiva entre estudiantes', 'deportes', 'imagenes/galeria11.jpg', 11, TRUE, FALSE),
    ('Actividad institucional', 'Momento de la vida escolar', 'eventos', 'imagenes/galeria12.jpg', 12, TRUE, FALSE)
ON CONFLICT (categoria, imagen_url) DO UPDATE SET
    titulo = EXCLUDED.titulo,
    descripcion = EXCLUDED.descripcion,
    orden = EXCLUDED.orden,
    activo = EXCLUDED.activo,
    destacado = EXCLUDED.destacado,
    fecha_actualizacion = CURRENT_TIMESTAMP;

COMMIT;
