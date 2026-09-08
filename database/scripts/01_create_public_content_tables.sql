BEGIN;

CREATE TABLE IF NOT EXISTS oferta_academica (
    id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    nivel VARCHAR(50) NOT NULL,
    icono VARCHAR(80),
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS galeria (
    id BIGSERIAL PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(30) NOT NULL CHECK (categoria IN ('academico', 'deportes', 'cultural', 'eventos')),
    imagen_url VARCHAR(255) NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    destacado BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_galeria_categoria_imagen UNIQUE (categoria, imagen_url)
);

CREATE TABLE IF NOT EXISTS requisitos_matricula (
    id BIGSERIAL PRIMARY KEY,
    nivel VARCHAR(50) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS requisitos_matricula_item (
    id BIGSERIAL PRIMARY KEY,
    requisito_id BIGINT NOT NULL,
    texto TEXT NOT NULL,
    orden INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_requisito_texto UNIQUE (requisito_id, texto),
    CONSTRAINT fk_requisito_matricula
        FOREIGN KEY (requisito_id)
        REFERENCES requisitos_matricula(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS preinscripciones (
    id BIGSERIAL PRIMARY KEY,
    nombres VARCHAR(150) NOT NULL,
    apellidos VARCHAR(150) NOT NULL,
    tipo_documento VARCHAR(30) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE,
    email VARCHAR(150),
    telefono VARCHAR(50),
    nivel_interes VARCHAR(50) NOT NULL,
    sede VARCHAR(80),
    observaciones TEXT,
    estado VARCHAR(30) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'revisado', 'aceptado', 'rechazado')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_sitio (
    id BIGSERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    tipo VARCHAR(30) NOT NULL DEFAULT 'string',
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_oferta_academica_activa_orden
    ON oferta_academica (activo, orden);

CREATE INDEX IF NOT EXISTS idx_galeria_activa_categoria_orden
    ON galeria (activo, categoria, orden);

CREATE INDEX IF NOT EXISTS idx_requisitos_matricula_activa_orden
    ON requisitos_matricula (activo, orden);

CREATE INDEX IF NOT EXISTS idx_preinscripciones_estado
    ON preinscripciones (estado, fecha_creacion);

COMMIT;
