-- name: GetDefaultRole :one
SELECT * FROM roles
WHERE nombre = 'ciudadano';
