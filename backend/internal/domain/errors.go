package domain

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

var (
	ErrEmailTaken          = errors.New("email already registered")
	ErrInvalidCredentials  = errors.New("invalid credentials")
	ErrUserNotFound        = errors.New("user not found")
	ErrReporteNotFound     = errors.New("reporte not found")
	ErrIncidenteNotFound   = errors.New("incidente not found")
	ErrIncidenteInvalido   = errors.New("invalid incidente")
	ErrArchivoInvalido     = errors.New("archivo inválido")
	ErrArchivoMuyGrande    = errors.New("archivo demasiado grande")
	ErrImagenMuyGrande     = errors.New("la imagen excede las dimensiones permitidas")
	ErrMultimediaYaExiste  = errors.New("el usuario ya subió un archivo a este reporte")
	ErrAlmacenNoDisponible = errors.New("el almacenamiento de archivos no está disponible")
	ErrIncidenteNameTaken  = errors.New("incidente name taken")
	ErrTagNameTaken        = errors.New("tag name taken")
	ErrAreaIncompleta      = errors.New("area incompleta")
	ErrAreaInvalida        = errors.New("area invalida")
	ErrEstadoInvalido      = errors.New("estado invalido")
	ErrTransicionInvalida  = errors.New("transicion invalida")
	ErrOficialNoPermitido  = errors.New("rol no puede crear reportes oficiales")
	ErrEstadoNoPermitido   = errors.New("rol no puede cambiar el estado de reportes")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrReporteNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
	{Err: ErrTransicionInvalida, Status: http.StatusConflict, Message: "transicion no valida"},
	{Err: ErrEmailTaken, Status: http.StatusConflict, Message: "el email ya está registrado"},
	{Err: ErrInvalidCredentials, Status: http.StatusUnauthorized, Message: "credenciales invalidas"},
	{Err: ErrUserNotFound, Status: http.StatusUnauthorized, Message: "no autenticado"},
	{Err: ErrMultimediaYaExiste, Status: http.StatusConflict, Message: "multimedia ya existe"},
	{Err: ErrArchivoInvalido, Status: http.StatusBadRequest, Message: "archivo invalido"},
	{Err: ErrArchivoMuyGrande, Status: http.StatusRequestEntityTooLarge, Message: "archivo muy grande"},
	{Err: ErrImagenMuyGrande, Status: http.StatusUnprocessableEntity, Message: "imagen muy grande"},
	{Err: ErrAlmacenNoDisponible, Status: http.StatusServiceUnavailable, Message: "almacenamiento no disponible, intenta más tarde"},
	{Err: ErrIncidenteNotFound, Status: http.StatusNotFound, Message: "incidente no encontrado"},
	{Err: ErrIncidenteInvalido, Status: http.StatusBadRequest}, // con el detalle del servicio
	{Err: ErrIncidenteNameTaken, Status: http.StatusConflict, Message: "ya existe un incidente con ese nombre"},
	{Err: ErrTagNameTaken, Status: http.StatusConflict, Message: "el incidente ya tiene un tag con ese nombre"},
	{Err: ErrAreaIncompleta, Status: http.StatusBadRequest, Message: "area incompleta"},
	{Err: ErrAreaInvalida, Status: http.StatusBadRequest, Message: "area invalida"},
	{Err: ErrEstadoInvalido, Status: http.StatusBadRequest, Message: "estado invalido"},
	{Err: ErrOficialNoPermitido, Status: http.StatusForbidden, Message: "un ciudadano no puede crear reportes oficiales"},
	{Err: ErrEstadoNoPermitido, Status: http.StatusForbidden, Message: "un ciudadano no puede cambiar el estado de un reporte"},
}

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
