package riesgo

import (
	"errors"
	"net/http"

	"github.com/ClubTECLA/tijuana-reporta/backend/internal/httperr"
)

var (
	ErrAreaInvalida    = errors.New("área inválida")
	ErrPeriodoInvalido = errors.New("periodo inválido")
)

// ReglasHTTP dice con qué status y mensaje responde la API cada error de
// arriba. Al agregar un Err…, agrégale aquí su regla.
var ReglasHTTP = []httperr.Regla{
	{Err: ErrAreaInvalida, Status: http.StatusBadRequest, Message: "el área es inválida: el mínimo no puede ser mayor que el máximo"},
	{Err: ErrPeriodoInvalido, Status: http.StatusBadRequest, Message: "el periodo es inválido: desde no puede ser posterior a hasta"},
}
