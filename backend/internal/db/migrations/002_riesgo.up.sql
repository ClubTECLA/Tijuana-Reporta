-- Reportes históricos que cuentan para el riesgo, con su peso (ver
-- backend/GUIA_RIESGO.md). Es la única fuente de datos de la funcionalidad
-- riesgo:
-- - Solo históricos (es_historico): los activos son de Incidentes.
-- - Sin descartados: el riesgo usa solo información válida (requerimiento R-10).

CREATE OR REPLACE FUNCTION a_metros(g geometry) RETURNS geometry
LANGUAGE sql IMMUTABLE PARALLEL SAFE
AS $$ SELECT ST_Transform(g, 32611) $$;

-- Vista y no tabla: se calcula al consultarla, así que refleja el estado y los
-- avistamientos actuales de cada reporte. Cambiar la fórmula es una migración
-- nueva con CREATE OR REPLACE VIEW, y subir riesgo.VersionModelo.
CREATE VIEW reporte_historico_peso AS
SELECT r.id AS reporte_id,
       r.incidente_id,
       r.created_at,
       p.geom,
       -- direccion viene como "calle · colonia" (geocodificación del cliente);
       -- sin dirección o sin la parte de la colonia queda NULL. El ::text es
       -- para sqlc, que no infiere el tipo de NULLIF.
       NULLIF(btrim(split_part(r.direccion, ' · ', 2)), '')::text AS colonia,
       -- credibilidad del estado × confirmación por avistamientos (logarítmica:
       -- el décimo avistamiento aporta menos que el primero).
       ((CASE r.estado_actual
             WHEN 'Verificado' THEN 1.0
             WHEN 'Resuelto'   THEN 1.0
             WHEN 'Probable'   THEN 0.75
             ELSE 0.5 -- Pendiente
         END)
        * (1 + ln(1 + r.avistamientos)))::float8 AS peso
FROM reporte r
JOIN puntos_origen p ON p.reporte_id = r.id
WHERE r.es_historico
AND r.estado_actual <> 'Descartado';
