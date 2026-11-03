package db

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Códigos de error de Postgres.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const (
	pgUniqueViolation     = "23505"
	pgForeignKeyViolation = "23503"
)

// IsUniqueViolation reporta si err viene de romper un UNIQUE o una PRIMARY KEY.
// Vive aquí para que las funcionalidades traduzcan a sus errores sin
// importar pgconn.
func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation
}

// IsForeignKeyViolation reporta si err viene de romper el FOREIGN KEY con el
// nombre dado.
func IsForeignKeyViolation(err error, constraint string) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgForeignKeyViolation && pgErr.ConstraintName == constraint
}

// IsNotFound reporta si err viene de una consulta :one que no devolvió filas.
func IsNotFound(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
