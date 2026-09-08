BEGIN;

INSERT INTO oferta_academica (nombre, slug, descripcion, nivel, icono, orden, activo)
VALUES
    (
        'Preescolar',
        'preescolar',
        'Ambiente seguro, alegre y pedagógico para despertar la curiosidad, la creatividad y la autonomía de los niños en sus primeras etapas de aprendizaje.',
        'preescolar',
        'fa-seedling',
        1,
        TRUE
    ),
    (
        'Básica Primaria',
        'basica-primaria',
        'Formación integral con enfoque académico, social y valorativo, orientada al desarrollo del pensamiento, la lectura y la escritura.',
        'primaria',
        'fa-book-open-reader',
        2,
        TRUE
    ),
    (
        'Básica Secundaria',
        'basica-secundaria',
        'Desarrollo cognitivo, emocional y académico con una mirada crítica, investigativa y orientada al proyecto de vida.',
        'secundaria',
        'fa-graduation-cap',
        3,
        TRUE
    )
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
    (
        'preescolar',
        'Documentos requeridos para matrícula de Preescolar',
        'Requisitos básicos para la inscripción y formalización del proceso de matrícula en preescolar.',
        1,
        TRUE
    ),
    (
        'primaria',
        'Documentos requeridos para matrícula de Primaria y Secundaria',
        'Requisitos básicos para la inscripción y formalización del proceso de matrícula en primaria y secundaria.',
        2,
        TRUE
    )
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
        ('Fotocopia de la cédula de ciudadanía del acudiente.', 2),
        ('Certificado o constancia de afiliación al FOSYGA/EPS.', 3),
        ('Certificado o constancia del Sisbén.', 4),
        ('Copia del certificado de vacunas.', 5),
        ('Copia de un recibo de servicios públicos del lugar de residencia.', 6),
        ('Una carpeta plástica tamaño oficio con gancho legajador.', 7)
) AS v(texto, orden)
WHERE rm.nivel = 'preescolar'
ON CONFLICT (requisito_id, texto) DO NOTHING;

INSERT INTO requisitos_matricula_item (requisito_id, texto, orden, activo)
SELECT rm.id, v.texto, v.orden, TRUE
FROM requisitos_matricula rm
CROSS JOIN (
    VALUES
        ('Boletín con informe final del año inmediatamente anterior aprobado.', 1),
        ('Registro civil de nacimiento del menor o tarjeta de identidad, según la edad.', 2),
        ('Fotocopia de la cédula de ciudadanía del acudiente.', 3),
        ('Certificado o constancia de afiliación al FOSYGA/EPS.', 4),
        ('Certificado o constancia del Sisbén.', 5),
        ('Copia de un recibo de servicios públicos del lugar de residencia.', 6),
        ('Una carpeta plástica tamaño oficio con gancho legajador.', 7)
) AS v(texto, orden)
WHERE rm.nivel = 'primaria'
ON CONFLICT (requisito_id, texto) DO NOTHING;

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
ON CONFLICT DO NOTHING;

INSERT INTO configuracion_sitio (clave, valor, tipo, activo)
VALUES
    ('institucion_nombre', 'I.E. Darío Torregroza Pérez', 'string', TRUE),
    ('institucion_lema', 'Camino a la excelencia', 'string', TRUE),
    ('direccion', 'Calle 18 # Carrera 27, Ciénaga, Magdalena', 'string', TRUE),
    ('telefono', '+57 (000) 000 0000', 'string', TRUE),
    ('email', 'iedariotorregrozaperez@semcienaga.gov.co', 'string', TRUE),
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

COMMIT;
