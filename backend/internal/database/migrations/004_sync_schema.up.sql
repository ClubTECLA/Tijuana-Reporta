-- Sincroniza bases de datos creadas con la versión anterior de 001_init_schema.up.sql.
-- En bases nuevas (001 ya actualizado) todo esto es un no-op.

-- ============================================================
-- CATÁLOGOS
-- ============================================================

ALTER TABLE incidentes ADD COLUMN IF NOT EXISTS esta_activo BOOLEAN;

CREATE TABLE IF NOT EXISTS acciones (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

-- ============================================================
-- REPORTES: nuevo enum estado + es_oficial
-- ============================================================

ALTER TABLE reporte ADD COLUMN IF NOT EXISTS es_oficial BOOLEAN NOT NULL DEFAULT false;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'estado' AND e.enumlabel = 'Sin revisar'
    ) THEN
        -- 'Oficial' pasa a ser una bandera independiente del estado
        UPDATE reporte SET es_oficial = true WHERE estado_actual::text = 'Oficial';

        ALTER TYPE estado RENAME TO estado_old;
        CREATE TYPE estado AS ENUM ('Pendiente', 'Probable', 'Verificado', 'Resuelto', 'Descartado', 'Expirado');

        ALTER TABLE reporte ALTER COLUMN estado_actual DROP DEFAULT;
        ALTER TABLE reporte ALTER COLUMN estado_actual TYPE estado USING (
            CASE estado_actual::text
                WHEN 'Sin revisar' THEN 'Pendiente'
                WHEN 'En revision' THEN 'Probable'
                WHEN 'Arreglado' THEN 'Resuelto'
                WHEN 'Expirado' THEN 'Expirado'
                WHEN 'Oficial' THEN 'Verificado'
            END
        )::estado;
        ALTER TABLE reporte ALTER COLUMN estado_actual SET DEFAULT 'Pendiente';

        DROP TYPE estado_old;
    END IF;
END $$;

-- ============================================================
-- NOTIFICACIONES E HISTORIAL
-- ============================================================

CREATE TABLE IF NOT EXISTS notificaciones (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notificacion TEXT
);

CREATE TABLE IF NOT EXISTS notificaciones_counts (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS historial (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id),
    accion_id INTEGER NOT NULL REFERENCES acciones (id),
    nombre_target TEXT,
    descripcion TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
