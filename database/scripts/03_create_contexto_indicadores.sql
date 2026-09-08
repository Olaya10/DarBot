CREATE TABLE IF NOT EXISTS indicadores_contexto (
    id BIGSERIAL PRIMARY KEY,
    indicador VARCHAR(100) NOT NULL UNIQUE,
    tipo VARCHAR(50) NOT NULL DEFAULT 'CONTEXTO',
    prioridad INTEGER NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO indicadores_contexto (indicador, tipo, prioridad, activa)
VALUES
    ('mañana', 'CONTEXTO', 10, TRUE),
    ('hoy', 'CONTEXTO', 10, TRUE),
    ('ayer', 'CONTEXTO', 10, TRUE),
    ('eso', 'CONTEXTO', 9, TRUE),
    ('ese', 'CONTEXTO', 9, TRUE),
    ('esa', 'CONTEXTO', 9, TRUE),
    ('a qué hora', 'CONTEXTO', 8, TRUE),
    ('cuándo', 'CONTEXTO', 8, TRUE),
    ('dónde', 'CONTEXTO', 8, TRUE),
    ('cómo', 'CONTEXTO', 8, TRUE),
    ('por qué', 'CONTEXTO', 8, TRUE),
    ('qué más', 'CONTEXTO', 7, TRUE),
    ('algo más', 'CONTEXTO', 7, TRUE),
    ('y eso', 'CONTEXTO', 9, TRUE),
    ('y esa', 'CONTEXTO', 9, TRUE),
    ('y el', 'CONTEXTO', 7, TRUE),
    ('y la', 'CONTEXTO', 7, TRUE)
ON CONFLICT (indicador) DO NOTHING;
