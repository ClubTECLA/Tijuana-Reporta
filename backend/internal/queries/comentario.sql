-- name: CreateComentario :one
INSERT INTO comentarios (reporte_id, user_id, comentario)
VALUES ($1, $2, $3)
RETURNING *;
