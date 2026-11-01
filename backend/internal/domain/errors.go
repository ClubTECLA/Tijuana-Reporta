package domain

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
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
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrReporteNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
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
}
