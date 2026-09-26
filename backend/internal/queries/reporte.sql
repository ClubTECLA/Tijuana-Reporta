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
SELECT * FROM location WHERE reporte_id = $1;