BEGIN;

DELETE FROM contactos
WHERE tipo IN ('Telefono', 'Correo', 'Horario')
AND valor IN (
    '+57 300 000 0000',
    'rectoria@iedtp.edu.co',
    '+57 301 000 0001',
    'secretaria@iedtp.edu.co',
    'Lunes a viernes 7:30 a 12:00'
);

DELETE FROM areas
WHERE nombre IN ('Rectoría', 'Secretaría', 'Coordinación');

DELETE FROM sedes
WHERE nombre IN ('Sede Principal', 'Sede de Atención');

DELETE FROM informacion_institucional
WHERE nombre_institucion = 'I.E. Darío Torregroza Pérez';

COMMIT;
