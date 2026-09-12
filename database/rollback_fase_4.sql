BEGIN;

-- Fase 4: limpiar datos de contenido público complementario si se cargan desde el admin
DELETE FROM noticias WHERE titulo IN (
    'Boletín institucional',
    'Celebración de la comunidad educativa',
    'Jornada pedagógica'
);

DELETE FROM eventos WHERE titulo IN (
    'Festival cultural escolar',
    'Jornada deportiva institucional',
    'Encuentro de familias'
);

DELETE FROM documentos WHERE nombre IN (
    'Manual de convivencia',
    'Cronograma académico',
    'Formato de matrícula'
);

COMMIT;
