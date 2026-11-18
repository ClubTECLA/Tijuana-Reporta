-- name: GetCorteMantenimiento :one
SELECT ultimo_corte FROM mantenimiento_estado WHERE nombre = $1;

-- name: SetCorteMantenimiento :exec
INSERT INTO mantenimiento_estado (nombre, ultimo_corte)
VALUES ($1, $2)
ON CONFLICT (nombre) DO UPDATE SET ultimo_corte = EXCLUDED.ultimo_corte;

-- name: ListMultimediaPathsExistentes :many
-- De las rutas dadas, las que tienen fila en multimedia.
SELECT path FROM multimedia WHERE path = ANY(@paths::text[]);

-- name: ListMultimediaPathsCreadas :many
-- Rutas de las filas creadas desde (incluido) hasta (no incluido).
SELECT path FROM multimedia WHERE created_at >= @desde AND created_at < @hasta;

-- name: DeleteMultimediaPorPaths :execrows
DELETE FROM multimedia WHERE path = ANY(@paths::text[]);
