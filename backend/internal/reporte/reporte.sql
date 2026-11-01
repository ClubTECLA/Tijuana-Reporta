-- name: CreateReporte :one
INSERT INTO reporte (incidente_id, es_oficial, direccion)
VALUES ($1, $2, sqlc.narg(direccion))
RETURNING *;

-- name: CreateLocation :one
INSERT INTO location (reporte_id, latitude, longitude, user_id)
VALUES ($1, sqlc.arg(latitude), sqlc.arg(longitude), $2)
RETURNING *;

-- name: ListLocationsByReporteId :many
SELECT *
FROM location WHERE reporte_id = $1 ORDER BY created_at;

-- name: GetReporteById :one
-- La etiqueta del incidente se trae para armar el título (reporte.Titulo).
SELECT sqlc.embed(r), i.etiqueta AS incidente_etiqueta
FROM reporte r
JOIN incidentes i ON i.id = r.incidente_id
WHERE r.id = $1;

-- name: ListMultimediaByReporteId :many
SELECT * FROM multimedia WHERE reporte_id = $1 ORDER BY created_at;

-- name: ListTagsByReporteId :many
SELECT t.id, t.nombre, rtc.count
FROM reporte_tag_counts rtc
JOIN tags t ON t.id = rtc.tag_id
WHERE rtc.reporte_id = $1
AND rtc.count > 0
ORDER BY rtc.count DESC;

-- name: GetPuntoOrigenByReporteId :one
SELECT latitude, longitude
FROM puntos_origen WHERE reporte_id = $1;

-- name: ListReportesResumen :many
SELECT r.id, r.incidente_id, r.estado_actual, r.avistamientos, r.es_oficial, p.latitude, p.longitude,
       r.direccion, i.etiqueta AS incidente_etiqueta
FROM reporte r
JOIN puntos_origen p ON p.reporte_id = r.id
JOIN incidentes i ON i.id = r.incidente_id
WHERE NOT r.es_historico
AND (sqlc.narg(min_lat)::float8 IS NULL OR p.latitude >= sqlc.narg(min_lat))
AND (sqlc.narg(max_lat)::float8 IS NULL OR p.latitude <= sqlc.narg(max_lat))
AND (sqlc.narg(min_lng)::float8 IS NULL OR p.longitude >= sqlc.narg(min_lng))
AND (sqlc.narg(max_lng)::float8 IS NULL OR p.longitude <= sqlc.narg(max_lng));

-- name: AddAvistamientoById :one
UPDATE reporte
SET avistamientos = avistamientos + 1 
WHERE id = $1
RETURNING id, avistamientos;

-- name: CreateUserReporte :one
INSERT INTO users_reports (user_id, reporte_id) VALUES ($1, $2) RETURNING *;

-- name: UpdateEstadoReporte :one
UPDATE reporte
SET estado_actual = $2,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: ListReportesPorUbicacion :many
-- sqlc no conoce las funciones de PostGIS, así que cada parámetro lleva su
-- cast explícito; sin él se generaría como interface{}.
-- ST_DWithin usa el índice GiST de puntos_origen.geom.
SELECT r.id, r.incidente_id, r.estado_actual, r.avistamientos, r.es_oficial,
       p.latitude, p.longitude, r.direccion, i.etiqueta AS incidente_etiqueta,
       ST_Distance(p.geom, ST_MakePoint(sqlc.arg(lng)::float8, sqlc.arg(lat)::float8)::geography)::float8 AS distancia_m
FROM reporte r
JOIN puntos_origen p ON p.reporte_id = r.id
JOIN incidentes i ON i.id = r.incidente_id
WHERE NOT r.es_historico
AND ST_DWithin(p.geom, ST_MakePoint(sqlc.arg(lng)::float8, sqlc.arg(lat)::float8)::geography, sqlc.arg(radio)::float8)
AND (sqlc.narg(incidente_ids)::int[] IS NULL OR r.incidente_id = ANY(sqlc.narg(incidente_ids)::int[]))
-- estados viaja como text[]: pgx no sabe codificar el arreglo del enum estado.
AND (sqlc.narg(estados)::text[] IS NULL OR r.estado_actual = ANY(sqlc.narg(estados)::text[]::estado[]))
AND (sqlc.narg(desde)::timestamptz IS NULL OR r.created_at >= sqlc.narg(desde)::timestamptz)
ORDER BY distancia_m
LIMIT sqlc.arg(limite)::int;

-- name: ListReportesByUserId :many
-- Incluye los históricos: es el historial del usuario, no el mapa.
SELECT r.id, r.incidente_id, r.estado_actual, r.avistamientos, r.es_oficial, p.latitude, p.longitude,
       r.direccion, i.etiqueta AS incidente_etiqueta
FROM users_reports ur
JOIN reporte r ON r.id = ur.reporte_id
JOIN puntos_origen p ON p.reporte_id = r.id
JOIN incidentes i ON i.id = r.incidente_id
WHERE ur.user_id = $1
ORDER BY r.created_at DESC
LIMIT sqlc.arg(limite)::int;
-- name: GetEstadoReporteForUpdate :one
SELECT estado_actual FROM reporte WHERE id = $1 FOR UPDATE;

-- name: ListComentariosByReporteId :many
SELECT
    c.id,
    c.reporte_id,
    c.user_id,
    c.comentario,
    c.created_at,
    u.username,
    r.nombre AS rol_name
FROM
    comentarios c
    JOIN users u ON u.id = c.user_id
    JOIN roles r ON r.id = u.rol_id
WHERE
    c.reporte_id = $1
ORDER BY
    c.created_at;
