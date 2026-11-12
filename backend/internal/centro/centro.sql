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

-- name: ListCentros :many
SELECT id, tipo_centro, nombre, descripcion, image_path,
       latitude, longitude, capacidad, cantidad, activo, created_at
FROM centros
WHERE activo OR sqlc.arg(incluir_inactivos)::boolean
ORDER BY nombre;

-- name: GetCentroById :one
SELECT id, tipo_centro, nombre, descripcion, image_path,
       latitude, longitude, capacidad, cantidad, activo, created_at
FROM centros
WHERE id = $1;

-- name: CreateCentro :one
INSERT INTO centros (
    tipo_centro, nombre, descripcion, image_path,
    latitude, longitude, capacidad, cantidad, activo
)
VALUES (
    sqlc.arg(tipo_centro), sqlc.arg(nombre), sqlc.narg(descripcion), sqlc.narg(image_path),
    sqlc.arg(latitude), sqlc.arg(longitude), sqlc.narg(capacidad), sqlc.narg(cantidad),
    sqlc.arg(activo)::boolean
)
RETURNING id, tipo_centro, nombre, descripcion, image_path,
          latitude, longitude, capacidad, cantidad, activo, created_at;