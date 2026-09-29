-- name: CreateComentario :one
INSERT INTO comentarios (reporte_id, user_id, comentario)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListComentariosByReporteId :many
SELECT * FROM comentarios WHERE reporte_id = $1 ORDER BY created_at;
