-- Inserciones completas para los datos del chatbot
-- Incluye: intenciones, palabras clave, sinónimos, frases específicas, FAQs, negaciones y mensajes del sistema
-- Diseñado para Postgres; evita duplicados cuando es posible

-- 1) Intenciones principales
INSERT INTO intenciones (nombre, descripcion, prioridad, activa, fecha_creacion, fecha_actualizacion)
VALUES 
('CONSULTAR_EVENTOS', 'Consulta sobre eventos, actividades y reuniones', 10, true, NOW(), NOW()),
('CONSULTAR_NOTICIAS', 'Consulta sobre noticias, novedades y publicaciones', 9, true, NOW(), NOW()),
('CONSULTAR_DOCUMENTOS', 'Consulta sobre documentos, manuales y formatos', 8, true, NOW(), NOW()),
('CONSULTAR_SEDES', 'Consulta sobre ubicación y datos de sedes', 7, true, NOW(), NOW()),
('CONSULTAR_CONTACTOS', 'Consulta sobre contactos, teléfonos y correos', 7, true, NOW(), NOW()),
('CONSULTAR_HORARIOS', 'Consulta sobre horarios de atención', 6, true, NOW(), NOW()),
('CONSULTAR_SERVICIOS', 'Consulta sobre servicios institucionales', 5, true, NOW(), NOW()),
('CONSULTAR_INSTITUCION', 'Consulta sobre información general de la institución', 4, true, NOW(), NOW())
ON CONFLICT (nombre) DO UPDATE SET 
  descripcion = EXCLUDED.descripcion,
  prioridad = EXCLUDED.prioridad,
  activa = EXCLUDED.activa,
  fecha_actualizacion = NOW();

-- 2) Palabras clave por intención (evitar duplicados)
WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_EVENTOS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('evento'), ('eventos'), ('actividad'), ('actividades'),
  ('reunion'), ('reuniones'), ('agenda'), ('calendario'),
  ('proximo'), ('proximos'), ('feria'), ('taller')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_NOTICIAS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('noticia'), ('noticias'), ('novedad'), ('novedades'),
  ('publicacion'), ('publicaciones'), ('actualidad'), ('boletin')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_DOCUMENTOS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('documento'), ('documentos'), ('manual'), ('manuales'),
  ('circular'), ('circulares'), ('formato'), ('formatos'),
  ('archivo'), ('archivos'), ('descargar'), ('pdf'),
  ('guia'), ('guias')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_SEDES')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('sede'), ('sedes'), ('ubicacion'), ('ubicación'),
  ('campus'), ('direccion'), ('dirección'),
  ('donde queda'), ('donde está')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_CONTACTOS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('contacto'), ('contactos'), ('telefono'), ('teléfono'),
  ('correo'), ('email'), ('llamar'), ('escribir'),
  ('comunicarse'), ('mensaje'), ('whatsapp')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_HORARIOS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('horario'), ('horarios'), ('hora'), ('atencion'),
  ('atención'), ('abre'), ('abren'), ('cierra'),
  ('cierran'), ('jornada'), ('turno')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_SERVICIOS')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('servicio'), ('servicios'), ('biblioteca'),
  ('cafeteria'), ('cafetería'), ('enfermeria'),
  ('enfermería'), ('computo'), ('cómputo')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

WITH ev AS (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_INSTITUCION')
INSERT INTO palabras_clave_intencion (intencion_id, palabra, peso)
SELECT (SELECT id FROM ev), palabra, 1 FROM (VALUES
  ('institucion'), ('institución'), ('colegio'),
  ('informacion'), ('información'), ('quienes somos'),
  ('historia'), ('mision'), ('misión'),
  ('vision'), ('visión'), ('valores')
) AS p(palabra)
ON CONFLICT (intencion_id, palabra) DO NOTHING;

-- 3) Sinónimos (palabra_base -> sinonimo)
-- Evitar duplicados si existe constraint sobre (palabra_base, sinonimo)
INSERT INTO sinonimos (palabra_base, sinonimo, intencion_id, activa, fecha_creacion)
SELECT 'evento', 'actividad', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_EVENTOS'), true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sinonimos WHERE palabra_base = 'evento' AND sinonimo = 'actividad');

INSERT INTO sinonimos (palabra_base, sinonimo, intencion_id, activa, fecha_creacion)
SELECT 'noticia', 'novedad', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_NOTICIAS'), true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sinonimos WHERE palabra_base = 'noticia' AND sinonimo = 'novedad');

INSERT INTO sinonimos (palabra_base, sinonimo, intencion_id, activa, fecha_creacion)
SELECT 'documento', 'archivo', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_DOCUMENTOS'), true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sinonimos WHERE palabra_base = 'documento' AND sinonimo = 'archivo');

INSERT INTO sinonimos (palabra_base, sinonimo, intencion_id, activa, fecha_creacion)
SELECT 'telefono', 'teléfono', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_CONTACTOS'), true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sinonimos WHERE palabra_base = 'telefono' AND sinonimo = 'teléfono');

INSERT INTO sinonimos (palabra_base, sinonimo, intencion_id, activa, fecha_creacion)
SELECT 'sede', 'campus', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_SEDES'), true, NOW()
WHERE NOT EXISTS (SELECT 1 FROM sinonimos WHERE palabra_base = 'sede' AND sinonimo = 'campus');

-- 4) Frases específicas (frases completas que activan una intención)
INSERT INTO frases_especificas (frase, intencion_id, activa, peso, fecha_creacion, fecha_actualizacion)
SELECT '¿Qué eventos hay esta semana?', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_EVENTOS'), true, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM frases_especificas WHERE frase = '¿Qué eventos hay esta semana?');

INSERT INTO frases_especificas (frase, intencion_id, activa, peso, fecha_creacion, fecha_actualizacion)
SELECT '¿Dónde está la sede principal?', (SELECT id FROM intenciones WHERE nombre = 'CONSULTAR_SEDES'), true, 10, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM frases_especificas WHERE frase = '¿Dónde está la sede principal?');

-- 5) FAQs básicas (pregunta/respuesta)
INSERT INTO faqs (pregunta, respuesta, categoria, activa, fecha_creacion, fecha_actualizacion)
SELECT '¿Cuáles son los horarios de atención?', 'Los horarios de atención son de lunes a viernes de 8:00 a 17:00.', 'Horarios', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE pregunta = '¿Cuáles son los horarios de atención?');

INSERT INTO faqs (pregunta, respuesta, categoria, activa, fecha_creacion, fecha_actualizacion)
SELECT '¿Cómo contacto a la secretaria?', 'Puede comunicarse por teléfono al 555-1234 o por correo a secretaria@institucion.edu', 'Contacto', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE pregunta = '¿Cómo contacto a la secretaria?');

-- 6) Negaciones comunes
INSERT INTO negaciones (palabra, tipo, activa, fecha_creacion)
SELECT 'no', 'DIRECTA', true, NOW() WHERE NOT EXISTS (SELECT 1 FROM negaciones WHERE palabra = 'no');
INSERT INTO negaciones (palabra, tipo, activa, fecha_creacion)
SELECT 'sin', 'DIRECTA', true, NOW() WHERE NOT EXISTS (SELECT 1 FROM negaciones WHERE palabra = 'sin');
INSERT INTO negaciones (palabra, tipo, activa, fecha_creacion)
SELECT 'excepto', 'EXCEPCION', true, NOW() WHERE NOT EXISTS (SELECT 1 FROM negaciones WHERE palabra = 'excepto');

-- 7) Mensajes del sistema usados por el chatbot
INSERT INTO mensajes_sistema (clave, mensaje, categoria, activa, fecha_creacion, fecha_actualizacion)
VALUES
('WELCOME', 'Hola, soy el asistente virtual. ¿En qué puedo ayudarte hoy?', 'GLOBAL', true, NOW(), NOW()),
('NO_ENTENDIDO', 'Lo siento, no entendí tu pregunta. ¿Puedes reformularla?', 'GLOBAL', true, NOW(), NOW()),
('FALLBACK_INFO', 'Puedes revisar nuestra sección de preguntas frecuentes o contactar a la institución para más detalles.', 'GLOBAL', true, NOW(), NOW())
ON CONFLICT (clave) DO UPDATE SET mensaje = EXCLUDED.mensaje, fecha_actualizacion = NOW();

-- FIN
