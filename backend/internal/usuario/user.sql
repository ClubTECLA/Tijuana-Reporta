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

-- name: ListAllUsers :many
SELECT
    u.id,
    u.username,
    u.email,
    r.nombre AS rol_name,
    COUNT(ur.reporte_id)::int AS reportes_count
FROM
    users u
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN users_reports ur ON ur.user_id = u.id
GROUP BY
    u.id,
    r.nombre
ORDER BY
    u.username DESC;

-- name: CreatePIN :exec
INSERT INTO
    recovery_pins (user_id, pin_hash, expires_at)
VALUES
    ($1, $2, $3);

-- name: GetLatestActivePINByUserID :one
SELECT
    *
FROM
    recovery_pins
WHERE
    user_id = $1
    AND expires_at > now()
    AND used_at IS NULL
ORDER BY
    created_at DESC
LIMIT 1;

-- name: LockUserByID :exec
-- Serializa por cuenta la emisión de PIN: la segunda petición espera aquí hasta que la primera termine.
SELECT
    id
FROM
    users
WHERE
    id = $1
FOR UPDATE;

-- name: CountPINsLastHourByUserID :one
SELECT
    count(*)
FROM
    recovery_pins
WHERE
    user_id = $1
    AND created_at > now() - interval '1 hour';

-- name: AddPINAttemptByPINID :one
UPDATE
    recovery_pins
SET
    attempts = attempts + 1
WHERE
    id = $1
RETURNING attempts;

-- name: CancelPINByUserID :exec
UPDATE
    recovery_pins
SET
    used_at = now()
WHERE
    user_id = $1
    AND used_at IS NULL
    AND expires_at > now();

-- name: DeleteUsedOrExpiredPINByUserID :exec
DELETE FROM
    recovery_pins
WHERE
    user_id = $1
    AND created_at < now() - interval '1 hour'
    AND (used_at IS NOT NULL OR expires_at < now());

-- name: SetNewPasswordByUserID :exec
UPDATE
    users
SET
    password_hash = $1,
    -- Viene de la API, no de now(): se compara contra el iat del JWT, que
    -- firma la API con su reloj.
    password_changed_at = $2
WHERE
    id = $3;

-- name: SetPinAsUsedByID :execrows
UPDATE
    recovery_pins
SET
    used_at = now()
WHERE   
    id = $1
    AND used_at IS NULL
    AND expires_at > clock_timestamp();

-- name: GetPasswordChangedAtByUserID :one
SELECT
    password_changed_at
FROM
    users
WHERE
    id = $1;