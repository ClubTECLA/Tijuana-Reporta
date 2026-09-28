-- name: CreateReporte :one
INSERT INTO reporte (incidente_id, es_oficial)
VALUES ($1, $2)
RETURNING *;

-- name: CreateLocation :one
INSERT INTO location (reporte_id, latitude, longitude, user_id)
VALUES ($1, sqlc.arg(latitude)::float8, sqlc.arg(longitude)::float8, $2)
RETURNING *;

-- name: CreateFotoReporte :one
INSERT INTO fotos_reportes (reporte_id, image_path, user_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListLocationsByReporteId :many
SELECT id, reporte_id, latitude::float8 AS latitude, longitude::float8 AS longitude, user_id, created_at
FROM location WHERE reporte_id = $1 ORDER BY created_at;

-- name: GetReporteById :one
SELECT * FROM reporte WHERE id = $1;

-- name: ListFotosByReporteId :many
SELECT * FROM fotos_reportes WHERE reporte_id = $1 ORDER BY created_at;

-- name: ListTagsByReporteId :many
SELECT t.id, t.nombre, rtc.count
FROM reporte_tag_counts rtc
JOIN tags t ON t.id = rtc.tag_id
WHERE rtc.reporte_id = $1
AND rtc.count > 0
ORDER BY rtc.count DESC;

-- name: GetPuntoOrigenByReporteId :one
SELECT latitude::float8 AS latitude, longitude::float8 AS longitude
FROM puntos_origen WHERE reporte_id = $1;

-- name: ListReportesResumen :many
SELECT r.id, r.incidente_id, r.estado_actual, r.avistamientos, r.es_oficial, p.latitude::float8 AS latitude, p.longitude::float8 AS longitude
FROM reporte r
JOIN puntos_origen p ON p.reporte_id = r.id
WHERE NOT r.es_historico
AND (sqlc.narg(min_lat)::float8 IS NULL OR p.latitude >= sqlc.narg(min_lat)::float8)
AND (sqlc.narg(max_lat)::float8 IS NULL OR p.latitude <= sqlc.narg(max_lat)::float8)
AND (sqlc.narg(min_lng)::float8 IS NULL OR p.longitude >= sqlc.narg(min_lng)::float8)
AND (sqlc.narg(max_lng)::float8 IS NULL OR p.longitude <= sqlc.narg(max_lng)::float8);