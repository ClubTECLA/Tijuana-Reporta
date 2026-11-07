-- name: GetDefaultRole :one
SELECT * FROM roles
WHERE nombre = 'ciudadano';

-- name: ListRoles :many
SELECT id, nombre
FROM roles
ORDER BY id;
