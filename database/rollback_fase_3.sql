BEGIN;

DELETE FROM galeria
WHERE imagen_url IN (
    'imagenes/galeria1.jpg',
    'imagenes/galeria2.jpg',
    'imagenes/galeria3.jpg',
    'imagenes/galeria-4.jpg',
    'imagenes/galeria5.jpg',
    'imagenes/galeria6.jpg',
    'imagenes/galeria7.jpg',
    'imagenes/galeria8.jpg',
    'imagenes/galeria9.jpg',
    'imagenes/galeria10.jpg',
    'imagenes/galeria11.jpg',
    'imagenes/galeria12.jpg'
);

COMMIT;
