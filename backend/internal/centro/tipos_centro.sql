-- name: ListTiposCentro :many
SELECT * FROM tipos_centro
ORDER BY nombre;

-- name: GetTipoCentroById :one
SELECT * FROM tipos_centro
WHERE id = $1;

-- name: CreateTipoCentro :one
INSERT INTO tipos_centro (nombre)
VALUES (sqlc.arg(nombre))
RETURNING *;