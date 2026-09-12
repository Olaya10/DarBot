BEGIN;

DELETE FROM requisitos_matricula_item
WHERE texto IN (
    'Registro civil de nacimiento del menor (copia)',
    'Fotocopia de la cédula del acudiente.',
    'Certificado o constancia de afiliación al FOSYGA/EPS.',
    'Constancia del Sisbén.',
    'Copia del certificado de vacunas.',
    'Recibo de servicios públicos.',
    'Carpeta plástica tamaño oficio con gancho.',
    'Boletín con informe final del año anterior aprobado.',
    'Registro civil o tarjeta de identidad.',
    'Fotocopia de la cédula del acudiente.'
);

DELETE FROM requisitos_matricula
WHERE nivel IN ('preescolar', 'primaria');

DELETE FROM oferta_academica
WHERE slug IN ('preescolar', 'basica-primaria', 'basica-secundaria');

DELETE FROM configuracion_sitio
WHERE clave IN (
    'institucion_nombre',
    'institucion_lema',
    'direccion',
    'telefono',
    'email',
    'facebook',
    'instagram',
    'youtube',
    'logo_url',
    'mapa_embed'
);

COMMIT;
