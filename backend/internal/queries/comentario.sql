-- name: CreateComentario :one
WITH nuevo AS (
    INSERT INTO comentarios (reporte_id, user_id, comentario)
    VALUES ($1, $2, $3)
    RETURNING *
)
SELECT
    n.id,
    n.reporte_id,
    n.user_id,
    n.comentario,
    n.created_at,
    u.username,
    r.nombre AS rol_name
FROM
    nuevo n
    JOIN users u ON u.id = n.user_id
    JOIN roles r ON r.id = u.rol_id;
