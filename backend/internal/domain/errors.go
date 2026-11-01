package domain

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrReporteNotFound     = errors.New("reporte not found")
	ErrArchivoInvalido     = errors.New("archivo inválido")
	ErrArchivoMuyGrande    = errors.New("archivo demasiado grande")
	ErrImagenMuyGrande     = errors.New("la imagen excede las dimensiones permitidas")
	ErrMultimediaYaExiste  = errors.New("el usuario ya subió un archivo a este reporte")
	ErrAlmacenNoDisponible = errors.New("el almacenamiento de archivos no está disponible")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrReporteNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
	{Err: ErrMultimediaYaExiste, Status: http.StatusConflict, Message: "multimedia ya existe"},
	{Err: ErrArchivoInvalido, Status: http.StatusBadRequest, Message: "archivo invalido"},
	{Err: ErrArchivoMuyGrande, Status: http.StatusRequestEntityTooLarge, Message: "archivo muy grande"},
	{Err: ErrImagenMuyGrande, Status: http.StatusUnprocessableEntity, Message: "imagen muy grande"},
	{Err: ErrAlmacenNoDisponible, Status: http.StatusServiceUnavailable, Message: "almacenamiento no disponible, intenta más tarde"},
}
