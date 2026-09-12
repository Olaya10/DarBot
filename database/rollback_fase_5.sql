BEGIN;

-- Fase 5: limpieza general de contenido de la web pública
DELETE FROM preinscripciones WHERE email LIKE '%@iedtp.edu.co';
DELETE FROM configuracion_sitio WHERE clave LIKE '%institucion_%';
DELETE FROM configuracion_sitio WHERE clave IN ('direccion', 'telefono', 'email', 'facebook', 'instagram', 'youtube', 'logo_url', 'mapa_embed');

COMMIT;
