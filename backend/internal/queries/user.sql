-- name: CreateUser :one
INSERT INTO
    users (email, username, rol_id, password_hash)
VALUES
    ($1, $2, $3, $4) RETURNING *;

-- Se inserta junto con el usuario dentro de la misma transacción, para que
-- nunca quede un usuario sin forma de autenticarse ni un auth_provider 
-- sin padre.
-- name: CreateLocalAuthProvider :exec
INSERT INTO
    auth_providers (user_id, provider)
VALUES
    ($1, 'local');

-- name: GetUserByEmail :one
SELECT
    *
FROM
    users
WHERE
    email = $1;

-- name: GetUserByID :one
SELECT
    *
FROM
    users
WHERE
    id = $1;

-- name: GetUserWithRolByID :one
SELECT
    u.*,
    r.nombre AS rol_name
FROM
    users u
    JOIN roles r ON r.id = u.rol_id
WHERE
    u.id = $1;
