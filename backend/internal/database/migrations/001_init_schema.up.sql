-- TIJUANA REPORTA - POSTGRESQL SCHEMA
-- Migration inicial corregida

-- ============================================================
-- CATÁLOGOS BASE
-- ============================================================

-- Catálogo que contiene cada tipo de incidente.
CREATE TABLE incidentes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tiempo_limite SMALLINT,  -- Tiempo promedio que le toma a un incidente desaparecer o resolverse (en días)
    radio DECIMAL            -- Radio promedio del incidente
);

-- Catálogo de cada tipo de tag y a qué tipo de incidente pertenece.
-- El UNIQUE evita repetir el mismo tag dentro del mismo tipo de incidente.
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    incidente_id INTEGER NOT NULL REFERENCES incidentes (id),
    nombre VARCHAR(50) NOT NULL,
    peso INTEGER NOT NULL DEFAULT 1,
    UNIQUE (incidente_id, nombre)
);

-- Catálogo de roles del sistema.
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- ============================================================
-- USUARIOS Y AUTENTICACIÓN
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(15) UNIQUE,
    username VARCHAR(100) NOT NULL,
    rol_id INTEGER NOT NULL REFERENCES roles(id),
    password_hash TEXT, -- No es necesaria si el login es solo por Google
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indica si un usuario inició sesión con cuenta local o con Google (guarda el token/id del provider)
CREATE TABLE auth_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(20) NOT NULL,
    provider_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, provider)
);

-- ============================================================
-- REPORTES
-- ============================================================

CREATE TYPE estado AS ENUM ('Sin revisar', 'En revision', 'Arreglado', 'Expirado');

-- Tabla que mantiene todos los reportes creados.
-- Nota: ya no incluye "peso" (vive solo en reportes_scores) ni "punto_origen"
-- (se reemplaza por la tabla reporte_ubicacion, mantenida vía trigger).
CREATE TABLE reporte (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidente_id INTEGER NOT NULL REFERENCES incidentes(id),
    avistamientos INTEGER NOT NULL DEFAULT 0, -- Conteo de confirmaciones de que el incidente sigue vigente
    es_historico BOOLEAN NOT NULL DEFAULT false,
    estado_actual estado NOT NULL DEFAULT 'Sin revisar',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expirated_at TIMESTAMPTZ
);

-- Cada localización que ha reportado un usuario para un reporte (para calcular el centroide).
CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    user_id UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ubicación derivada (centroide) de cada reporte, mantenida por trigger vía incremental average.
-- Reemplaza la tabla puntos_origen: al vivir separada de "reporte", los updates frecuentes
-- de ubicación no reescriben la fila completa de reporte ni sus índices.
CREATE TABLE reporte_ubicacion (
    reporte_id UUID PRIMARY KEY REFERENCES reporte(id) ON DELETE CASCADE,
    latitude DECIMAL NOT NULL,
    longitude DECIMAL NOT NULL,
    sample_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foto subida por un usuario en un reporte. El UNIQUE limita a una foto por usuario por reporte.
CREATE TABLE fotos_reportes (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
    image_path TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (reporte_id, user_id)
);

-- ============================================================
-- TAGS DE REPORTES (con conteo y score mantenidos por trigger)
-- ============================================================

-- Registro de qué tags ha añadido cada usuario a cada reporte.
-- El UNIQUE evita que un mismo usuario añada el mismo tag dos veces.
CREATE TABLE incidente_tags (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags (id) ON DELETE CASCADE,
    added_by UUID NOT NULL REFERENCES users (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (reporte_id, tag_id, added_by)
);

-- Conteo de cuántas veces se ha confirmado cada tag en cada reporte. Mantenida por trigger.
CREATE TABLE reporte_tag_counts (
    reporte_id UUID NOT NULL REFERENCES reporte(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (reporte_id, tag_id)
);

-- Score total ponderado de cada reporte (única fuente de verdad del "peso"). Mantenida por trigger.
CREATE TABLE reportes_scores (
    reporte_id UUID PRIMARY KEY REFERENCES reporte(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- COMENTARIOS E HISTORIAL
-- ============================================================

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reporte(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    comentario TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de reportes que ha creado/reportado cada usuario.
CREATE TABLE users_reports (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id),
    reporte_id UUID NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
    UNIQUE (user_id, reporte_id)
);

-- Log histórico para análisis de zonas propensas a incidentes.
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incidente_id INTEGER NOT NULL REFERENCES incidentes (id),
    longitude DECIMAL NOT NULL,
    latitude DECIMAL NOT NULL,
    peso INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: conteo de tags + score ponderado por reporte
-- ============================================================

CREATE OR REPLACE FUNCTION update_tag_counts()
RETURNS TRIGGER AS $$
DECLARE
    v_reporte_id UUID;
    v_tag_id INTEGER;
    v_peso INTEGER;
    v_delta INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_reporte_id := NEW.reporte_id;
        v_tag_id := NEW.tag_id;
        v_delta := 1;
    ELSIF TG_OP = 'DELETE' THEN
        v_reporte_id := OLD.reporte_id;
        v_tag_id := OLD.tag_id;
        v_delta := -1;
    END IF;

    -- Actualiza (o crea) el conteo del tag en ese reporte
    INSERT INTO reporte_tag_counts (reporte_id, tag_id, count)
    VALUES (v_reporte_id, v_tag_id, GREATEST(v_delta, 0))
    ON CONFLICT (reporte_id, tag_id)
    DO UPDATE SET count = reporte_tag_counts.count + v_delta;

    -- Limpieza: si el conteo llega a 0, borra la fila
    DELETE FROM reporte_tag_counts
    WHERE reporte_id = v_reporte_id
      AND tag_id = v_tag_id
      AND count <= 0;

    -- Obtiene el peso del tag para actualizar el score total del reporte
    SELECT peso INTO v_peso FROM tags WHERE id = v_tag_id;

    INSERT INTO reportes_scores (reporte_id, total_score)
    VALUES (v_reporte_id, GREATEST(v_peso * v_delta, 0))
    ON CONFLICT (reporte_id)
    DO UPDATE SET total_score = reportes_scores.total_score + (v_peso * v_delta);

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_tag_counts
AFTER INSERT OR DELETE ON incidente_tags
FOR EACH ROW EXECUTE FUNCTION update_tag_counts();

-- ============================================================
-- TRIGGER: ubicación (centroide) del reporte, promedio incremental O(1)
-- ============================================================

CREATE OR REPLACE FUNCTION update_reporte_ubicacion()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO reporte_ubicacion (reporte_id, latitude, longitude, sample_count, updated_at)
    VALUES (NEW.reporte_id, NEW.latitude, NEW.longitude, 1, now())
    ON CONFLICT (reporte_id) DO UPDATE SET
        latitude = (reporte_ubicacion.latitude * reporte_ubicacion.sample_count + NEW.latitude)
                   / (reporte_ubicacion.sample_count + 1),
        longitude = (reporte_ubicacion.longitude * reporte_ubicacion.sample_count + NEW.longitude)
                    / (reporte_ubicacion.sample_count + 1),
        sample_count = reporte_ubicacion.sample_count + 1,
        updated_at = now();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_reporte_ubicacion
AFTER INSERT ON location
FOR EACH ROW EXECUTE FUNCTION update_reporte_ubicacion();

-- ============================================================
-- ÍNDICES ÚTILES
-- ============================================================

CREATE INDEX idx_reporte_incidente_id ON reporte (incidente_id);
CREATE INDEX idx_reporte_estado_actual ON reporte (estado_actual);
CREATE INDEX idx_location_reporte_id ON location (reporte_id);
CREATE INDEX idx_incidente_tags_reporte_id ON incidente_tags (reporte_id);
CREATE INDEX idx_tags_incidente_id ON tags (incidente_id);
CREATE INDEX idx_comentarios_reporte_id ON comentarios (reporte_id);