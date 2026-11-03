package reporte

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrNotFound           = errors.New("reporte not found")
	ErrIncidenteNotFound  = errors.New("incidente not found")
	ErrAreaIncompleta     = errors.New("area incompleta")
	ErrAreaInvalida       = errors.New("area invalida")
	ErrEstadoInvalido     = errors.New("estado invalido")
	ErrTransicionInvalida = errors.New("transicion invalida")
	ErrOficialNoPermitido = errors.New("rol no puede crear reportes oficiales")
	ErrEstadoNoPermitido  = errors.New("rol no puede cambiar el estado de reportes")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
	{Err: ErrTransicionInvalida, Status: http.StatusConflict, Message: "transicion no valida"},
	{Err: ErrIncidenteNotFound, Status: http.StatusNotFound, Message: "incidente no encontrado"},
	{Err: ErrAreaIncompleta, Status: http.StatusBadRequest, Message: "area incompleta"},
	{Err: ErrAreaInvalida, Status: http.StatusBadRequest, Message: "area invalida"},
	{Err: ErrEstadoInvalido, Status: http.StatusBadRequest, Message: "estado invalido"},
	{Err: ErrOficialNoPermitido, Status: http.StatusForbidden, Message: "un ciudadano no puede crear reportes oficiales"},
	{Err: ErrEstadoNoPermitido, Status: http.StatusForbidden, Message: "un ciudadano no puede cambiar el estado de un reporte"},
}
