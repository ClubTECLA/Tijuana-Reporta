-- name: CreateMultimedia :one
INSERT INTO multimedia (reporte_id, path, user_id)
VALUES ($1, $2, $3)
RETURNING *;

-- name: EsCreadorDeReporte :one
-- users_reports solo se llena al crear el reporte, así que hoy equivale al creador.
SELECT EXISTS (
    SELECT 1 FROM users_reports WHERE user_id = $1 AND reporte_id = $2
);
