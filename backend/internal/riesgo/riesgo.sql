-- Todas las consultas leen la vista reporte_historico_peso (migración 002):
-- solo reportes históricos válidos, con su peso. Ver backend/GUIA_RIESGO.md.
--
-- sqlc no conoce las funciones de PostGIS, así que cada parámetro lleva su
-- cast explícito; sin él se generaría como interface{}. Los filtros de tipo de
-- incidente y de periodo son opcionales: NULL = sin filtro.

-- name: ListCeldasCalor :many
-- Agrupa en metros reales: geom pasa a UTM 11N (EPSG:32611, la zona de
-- Tijuana) y ST_SnapToGrid lleva cada punto al nodo más cercano de la
-- cuadrícula, que queda como el centro de su celda. && sobre geography usa el
-- índice GiST de puntos_origen.geom.
SELECT ST_Y(c.centro)::float8 AS latitude,
       ST_X(c.centro)::float8 AS longitude,
       sum(c.peso)::float8 AS peso,
       count(*)::int AS reportes
FROM (
    SELECT ST_Transform(ST_SnapToGrid(ST_Transform(h.geom::geometry, 32611), sqlc.arg(tamano_celda_m)::float8), 4326) AS centro,
           h.peso
    FROM reporte_historico_peso h
    WHERE h.geom && ST_MakeEnvelope(sqlc.arg(min_lng)::float8, sqlc.arg(min_lat)::float8,
                                    sqlc.arg(max_lng)::float8, sqlc.arg(max_lat)::float8, 4326)::geography
    AND (sqlc.narg(incidente_ids)::int[] IS NULL OR h.incidente_id = ANY(sqlc.narg(incidente_ids)::int[]))
    AND (sqlc.narg(desde)::timestamptz IS NULL OR h.created_at >= sqlc.narg(desde)::timestamptz)
    AND (sqlc.narg(hasta)::timestamptz IS NULL OR h.created_at <= sqlc.narg(hasta)::timestamptz)
) c
GROUP BY c.centro;

-- name: ListZonasRiesgo :many
-- Zonas = grupos de reportes históricos cercanos entre sí (DBSCAN). Un reporte
-- forma zona si tiene al menos min_puntos reportes a menos de eps_m metros
-- (contándose a sí mismo); los demás quedan como ruido (zona NULL) y no se
-- devuelven. ST_ClusterDBSCAN solo acepta geometry: se trabaja en UTM 11N
-- (EPSG:32611) para que eps_m y radio_m sean metros reales. Los argumentos van
-- por posición porque sqlc no entiende la notación eps := ...
WITH puntos AS (
    SELECT h.colonia, h.peso, ST_Transform(h.geom::geometry, 32611) AS g
    FROM reporte_historico_peso h
    WHERE (sqlc.narg(incidente_ids)::int[] IS NULL OR h.incidente_id = ANY(sqlc.narg(incidente_ids)::int[]))
    AND (sqlc.narg(desde)::timestamptz IS NULL OR h.created_at >= sqlc.narg(desde)::timestamptz)
    AND (sqlc.narg(hasta)::timestamptz IS NULL OR h.created_at <= sqlc.narg(hasta)::timestamptz)
),
agrupados AS (
    SELECT p.colonia, p.peso, p.g,
           ST_ClusterDBSCAN(p.g, sqlc.arg(eps_m)::float8, sqlc.arg(min_puntos)::int) OVER () AS zona
    FROM puntos p
),
centros AS (
    SELECT a.zona, ST_Centroid(ST_Collect(a.g)) AS centro
    FROM agrupados a
    WHERE a.zona IS NOT NULL
    GROUP BY a.zona
)
SELECT ST_Y(ST_Transform(c.centro, 4326))::float8 AS latitude,
       ST_X(ST_Transform(c.centro, 4326))::float8 AS longitude,
       -- El 90 % de los reportes de la zona queda dentro del círculo: un
       -- reporte aislado en el borde no la infla.
       (percentile_cont(0.9) WITHIN GROUP (ORDER BY ST_Distance(c.centro, a.g)))::float8 AS radio_m,
       -- La colonia más frecuente de la zona (mode ignora los NULL). Si ningún
       -- reporte tiene colonia queda '' (sqlc genera string, que no acepta
       -- NULL); el nombre final lo decide el servicio.
       COALESCE(mode() WITHIN GROUP (ORDER BY a.colonia), '')::text AS colonia,
       count(*)::int AS reportes,
       sum(a.peso)::float8 AS peso
FROM agrupados a
JOIN centros c ON c.zona = a.zona
GROUP BY a.zona, c.centro
ORDER BY peso DESC, a.zona
LIMIT sqlc.arg(limite)::int;

-- name: ListColoniasHistorico :many
-- Pestaña Histórico: colonias con más peso en el periodo. Los reportes sin
-- colonia no entran en esta lista, pero sí en el mapa, las zonas y los totales.
SELECT h.colonia::text AS colonia,
       count(*)::int AS reportes,
       sum(h.peso)::float8 AS peso
FROM reporte_historico_peso h
WHERE h.colonia IS NOT NULL
AND (sqlc.narg(incidente_ids)::int[] IS NULL OR h.incidente_id = ANY(sqlc.narg(incidente_ids)::int[]))
AND (sqlc.narg(desde)::timestamptz IS NULL OR h.created_at >= sqlc.narg(desde)::timestamptz)
AND (sqlc.narg(hasta)::timestamptz IS NULL OR h.created_at <= sqlc.narg(hasta)::timestamptz)
GROUP BY h.colonia
ORDER BY peso DESC, colonia
LIMIT sqlc.arg(limite)::int;

-- name: ListConteoCategorias :many
-- Barras de "Incidentes por categoría". La suma de total es total_historicos.
SELECT h.incidente_id,
       count(*)::int AS total
FROM reporte_historico_peso h
WHERE (sqlc.narg(incidente_ids)::int[] IS NULL OR h.incidente_id = ANY(sqlc.narg(incidente_ids)::int[]))
AND (sqlc.narg(desde)::timestamptz IS NULL OR h.created_at >= sqlc.narg(desde)::timestamptz)
AND (sqlc.narg(hasta)::timestamptz IS NULL OR h.created_at <= sqlc.narg(hasta)::timestamptz)
GROUP BY h.incidente_id
ORDER BY total DESC, h.incidente_id;
