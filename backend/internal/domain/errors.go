package domain

import (
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

// Archivo escrito a mano: convive con el código generado por sqlc, que solo
// reescribe models.go, querier.go, db.go y los *.sql.go.

var (
	ErrEmailTaken         = errors.New("email already registered")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotFound       = errors.New("user not found")
)

// pgUniqueViolation es el código de error de Postgres para unique_violation.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const pgUniqueViolation = "23505"

// IsUniqueViolation reporta si err viene de romper un UNIQUE o una PRIMARY KEY.
// Vive aquí para que las capas de arriba traduzcan a errores de dominio sin
// importar pgconn.
func IsUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == pgUniqueViolation
}

// IsNotFound reporta si err viene de una consulta :one que no devolvió filas.
func IsNotFound(err error) bool {
	return errors.Is(err, pgx.ErrNoRows)
}
