-- Revierte 004_sync_schema.up.sql (el mapeo de estados es con pérdida: Probable/Descartado no tienen equivalente exacto)

DROP TABLE IF EXISTS historial;
DROP TABLE IF EXISTS notificaciones_counts;
DROP TABLE IF EXISTS notificaciones;
DROP TABLE IF EXISTS acciones;

ALTER TYPE estado RENAME TO estado_new;
CREATE TYPE estado AS ENUM ('Sin revisar', 'En revision', 'Arreglado', 'Expirado', 'Oficial');

ALTER TABLE reporte ALTER COLUMN estado_actual DROP DEFAULT;
ALTER TABLE reporte ALTER COLUMN estado_actual TYPE estado USING (
    CASE
        WHEN es_oficial THEN 'Oficial'
        WHEN estado_actual::text = 'Pendiente' THEN 'Sin revisar'
        WHEN estado_actual::text = 'Probable' THEN 'En revision'
        WHEN estado_actual::text = 'Verificado' THEN 'En revision'
        WHEN estado_actual::text = 'Resuelto' THEN 'Arreglado'
        ELSE 'Expirado'
    END
)::estado;
ALTER TABLE reporte ALTER COLUMN estado_actual SET DEFAULT 'Sin revisar';

DROP TYPE estado_new;

ALTER TABLE reporte DROP COLUMN IF EXISTS es_oficial;
ALTER TABLE incidentes DROP COLUMN IF EXISTS esta_activo;
