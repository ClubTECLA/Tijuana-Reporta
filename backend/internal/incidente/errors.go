package incidente

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrNotFound     = errors.New("incidente not found")
	ErrInvalido     = errors.New("invalid incidente")
	ErrNameTaken    = errors.New("incidente name taken")
	ErrTagNameTaken = errors.New("tag name taken")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrNotFound, Status: http.StatusNotFound, Message: "incidente no encontrado"},
	{Err: ErrInvalido, Status: http.StatusBadRequest}, // con el detalle del servicio
	{Err: ErrNameTaken, Status: http.StatusConflict, Message: "ya existe un incidente con ese nombre"},
	{Err: ErrTagNameTaken, Status: http.StatusConflict, Message: "el incidente ya tiene un tag con ese nombre"},
}
