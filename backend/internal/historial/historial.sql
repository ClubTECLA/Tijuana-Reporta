-- name: CreateHistorialEvento :exec
INSERT INTO historial (actor_id, accion, entidad, entidad_id, datos)
VALUES ($1, $2, $3, $4, $5);

-- name: ListHistorialPorEntidad :many
SELECT * FROM historial
WHERE entidad = $1 AND entidad_id = $2
ORDER BY creado_en DESC
LIMIT $3;
