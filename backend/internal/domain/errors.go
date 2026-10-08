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
	ErrReporteNotFound    = errors.New("reporte not found")
	ErrIncidenteNotFound  = errors.New("incidente not found")
	ErrIncidenteInvalido  = errors.New("invalid incidente")
	ErrIncidenteNameTaken = errors.New("incidente name taken")
	ErrTagNameTaken       = errors.New("tag name taken")
	ErrAreaIncompleta     = errors.New("area incompleta")
	ErrAreaInvalida       = errors.New("area invalida")
	ErrTransicionInvalida = errors.New("transicion invalida")
)

// Códigos de error de Postgres.
// https://www.postgresql.org/docs/current/errcodes-appendix.html
const (
	pgUniqueViolation     = "23505"
	pgForeignKeyViolation = "23503"
)

// IsUniqueViolation reporta si err viene de romper un UNIQUE o una PRIMARY KEY.
// Vive aquí para que las capas de arriba traduzcan a errores de dominio sin
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
