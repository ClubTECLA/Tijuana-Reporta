-- name: CreateIncidente :one
INSERT INTO incidentes (nombre, tiempo_limite, radio, esta_activo, color)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: CreateTag :one
INSERT INTO tags (incidente_id, nombre, peso)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetIncidenteById :one
SELECT * FROM incidentes WHERE id = $1;

-- Los inactivos solo se incluyen si se piden (p. ej. para una pantalla de
-- administración).
-- name: ListIncidentes :many
SELECT * FROM incidentes
WHERE esta_activo OR sqlc.arg(incluir_inactivos)::boolean
ORDER BY nombre;

-- name: ListTagsByIncidenteId :many
SELECT * FROM tags
WHERE incidente_id = $1
ORDER BY id;

-- Los tags de varios incidentes en una sola consulta, para no hacer una por
-- incidente al listar.
-- name: ListTagsByIncidenteIds :many
SELECT * FROM tags
WHERE incidente_id = ANY(sqlc.arg(incidente_ids)::int[])
ORDER BY incidente_id, id;
