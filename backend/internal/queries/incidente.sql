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