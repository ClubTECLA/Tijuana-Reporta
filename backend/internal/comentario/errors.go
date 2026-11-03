package comentario

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var ErrReporteNotFound = errors.New("reporte not found")

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrReporteNotFound, Status: http.StatusNotFound, Message: "reporte no encontrado"},
}
