package multimedia

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/almacen"
	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrReporteNotFound  = errors.New("reporte not found")
	ErrArchivoInvalido  = errors.New("archivo inválido")
	ErrArchivoMuyGrande = errors.New("archivo demasiado grande")
	ErrImagenMuyGrande  = errors.New("la imagen excede las dimensiones permitidas")
	ErrYaExiste         = errors.New("el usuario ya subió un archivo a este reporte")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba, y el del almacén cuando no se puede guardar o borrar un archivo.
// Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrReporteNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
	{Err: ErrYaExiste, Status: http.StatusConflict, Message: "multimedia ya existe"},
	{Err: ErrArchivoInvalido, Status: http.StatusBadRequest, Message: "archivo invalido"},
	{Err: ErrArchivoMuyGrande, Status: http.StatusRequestEntityTooLarge, Message: "archivo muy grande"},
	{Err: ErrImagenMuyGrande, Status: http.StatusUnprocessableEntity, Message: "imagen muy grande"},
	{Err: almacen.ErrNoDisponible, Status: http.StatusServiceUnavailable, Message: "almacenamiento no disponible, intenta más tarde"},
}
